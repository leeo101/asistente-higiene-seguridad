import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Download, Search, AlertTriangle, FileText, ChevronRight, X, User, Briefcase, Activity, Calendar, FileQuestion, Users, FileSignature, CheckCircle2, Shield, Save, Building2, TreeDeciduous, ShieldAlert, Zap, Box, Wind, Droplets, ArrowUpCircle, Truck, Pencil, Share2, Trash2, QrCode, Camera, MapPin, Sparkles, UserPlus, ListPlus, ChevronLeft, Printer, Mic, MicOff } from 'lucide-react';
import PremiumHeader from '../components/PremiumHeader';
import { usePaywall } from '../hooks/usePaywall';
import ShareModal from '../components/ShareModal';
import QRModal from '../components/QRModal';
import AccidentPdfGenerator from '../components/AccidentPdfGenerator';
import PdfSignatures from '../components/PdfSignatures';
import SignatureCanvas from '../components/SignatureCanvas';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { downloadCSV } from '../services/exportCsv';
import { DataTable } from '../components/DataTable';
import {
  ModuleFormLayout,
  ModuleFormToolbar,
  ModuleFormSection,
  ModuleActionBar,
} from '../components/module';
import toast from 'react-hot-toast';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

const SECTIONS = ['Datos Generales', 'Accidentado', 'Descripción y Testigos', 'Análisis Causal', 'Medidas Preventivas', 'Firmas'];

const severityConfig: Record<string, {color: string;bg: string;}> = {
  'Leve': { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  'Moderado': { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  'Grave': { color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  'Mortal': { color: '#dc2626', bg: 'rgba(220,38,38,0.14)' }
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

function AdjuntosSection({
  adjuntos,
  onAdd,
  onRemove,
  accentColor = '#2563eb'





}: {adjuntos: string[];onAdd: (base64: string) => void;onRemove: (index: number) => void;accentColor?: string;}) {
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onAdd(reader.result);
        }
      };
      reader.readAsDataURL(file);
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="mt-[1.25rem]">
      <p className="text-[0.875rem] font-[600] text-[#334155] mb-[0.5rem]">
        Registro Fotográfico / Evidencia
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles} className="hidden" />

      
      <button type="button" onClick={() => fileRef.current?.click()}
      style={{




        background: accentColor + '14',
        color: accentColor,
        border: `1px solid ${accentColor}44`




      }} className="display-[inline-flex] items-center gap-[0.5rem] p-[0.5rem_1rem] rounded-[0.75rem] cursor-pointer font-[600] text-[0.85rem]">
        
        <Camera size={16} /> Adjuntar Foto
      </button>
      {adjuntos.length > 0 &&
      <div className="flex flex-wrap gap-[0.75rem] mt-[0.75rem]">
          {adjuntos.map((src, idx) =>
        <div key={idx} className="relative w-[96] h-[96]">
              <img
            src={src}
            alt={`adjunto-${idx}`} className="w-[96] h-[96] object-fit-[cover] rounded-[0.75rem] border-[1px_solid_#e2e8f0]" />







          
              <button
            type="button"
            onClick={() => onRemove(idx)}
            style={{

              top: -6,
              right: -6











            }} className="absolute w-[22] h-[22] rounded-[50%] bg-[#ef4444] text-[#fff] border-none cursor-pointer flex items-center justify-center p-[0]">
            
                <X size={13} />
              </button>
            </div>
        )}
        </div>
      }
    </div>);

}

export default function AccidentInvestigation(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { syncCollection } = useSync();

  useDocumentTitle('Investigación de Accidentes');

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // List vs Form state
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [qrTarget, setQrTarget] = useState<any>(null);
  const [shareItem, setShareItem] = useState<any>(null);
  const [printItem, setPrintItem] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<any>({
    fecha: new Date().toISOString().split('T')[0],
    hora: '', empresa: '', ubicacion: '', gravedad: 'Leve',
    victimaNombre: '', victimaDni: '', victimaPuesto: '', victimaAntiguedad: '', lesion: '', parteCuerpo: '',
    descripcionHecho: '', testigos: [{ nombre: '', declaracion: '' }],
    problemaCentral: '', porques: [''],
    medidas: [{ accion: '', responsable: '', fechaLimite: '' }],
    fotos: [],
    operatorSignature: '', supervisorSignature: '', signature: '',
    showSignatures: { operator: true, professional: true, supervisor: true }
  });

  const [professional, setProfessional] = useState<any>({ name: '', license: '', signature: null, stamp: null });
  
  const [isListeningVoice, setIsListeningVoice] = useState(false);

  const handleVoiceDictation = () => {
    requirePro(() => {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error('Tu navegador no soporta reconocimiento de voz.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'es-AR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListeningVoice(true);
        toast('Escuchando dictado... (Hablá ahora)', { icon: '🎙️' });
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListeningVoice(false);
        setFormData((prev: any) => ({
          ...prev,
          descripcionHecho: prev.descripcionHecho ? prev.descripcionHecho + ' ' + transcript : transcript
        }));
        toast.success('Dictado completado');
      };

      recognition.onerror = () => {
        setIsListeningVoice(false);
        toast.error('Error al escuchar. Intentá de nuevo.');
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
    });
  };

  const loadHistory = () => {
    const h = JSON.parse(localStorage.getItem('accident_history') || '[]');
    setHistory(h.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadHistory();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

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
        name: data.name || '',
        license: data.license || '',
        signature: signature,
        stamp: stamp
      });
    } else {
      setProfessional((prev: any) => ({ ...prev, signature, stamp }));
    }

    if (location.state?.editData) {
      const editData = location.state.editData;
      setFormData({
        ...editData,
        operatorSignature: editData.operatorSignature || '',
        supervisorSignature: editData.supervisorSignature || editData.signature || '',
        signature: editData.signature || editData.supervisorSignature || '',
        showSignatures: editData.showSignatures || { operator: true, professional: true, supervisor: true }
      });
      setIsEdit(true);
      setIsFormVisible(true);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [location.state]);

  useEffect(() => {
    if (isFormVisible) window.scrollTo(0, 0);
  }, [currentStep, isFormVisible]);

  const setShowSignatures = (updater: any) => {
    setFormData((prev: any) => {
      const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
      return { ...prev, showSignatures: updated };
    });
  };
  const showSignatures = formData.showSignatures || { operator: true, professional: true, supervisor: true };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (arrayName: string, index: number, field: string | null, value: string) => {
    setFormData((prev: any) => {
      const newArray = [...prev[arrayName]];
      if (field === null) {
        newArray[index] = value;
      } else {
        newArray[index] = { ...newArray[index], [field]: value };
      }
      return { ...prev, [arrayName]: newArray };
    });
  };

  const addArrayItem = (arrayName: string, defaultItem: any) => {
    setFormData((prev: any) => ({ ...prev, [arrayName]: [...prev[arrayName], defaultItem] }));
  };

  const removeArrayItem = (arrayName: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_: any, i: number) => i !== index)
    }));
  };

  const handleNext = () => {if (currentStep < SECTIONS.length - 1) setCurrentStep((s) => s + 1);};
  const handlePrev = () => {if (currentStep > 0) setCurrentStep((s) => s - 1);};

  const handleSave = () => {
    if (!formData.empresa || !formData.victimaNombre) {
      toast.error('La empresa y el nombre del accidentado son obligatorios.');
      return;
    }

    const report = {
      id: isEdit ? formData.id : Date.now(),
      date: formData.fecha || new Date().toISOString(),
      ...formData,
      professionalSignature: formData.professionalSignature || professional.signature,
      professionalName: formData.professionalName || professional.name,
      professionalLicense: formData.professionalLicense || professional.license,
      professionalStamp: formData.professionalStamp || professional.stamp
    };

    const currentHistory = JSON.parse(localStorage.getItem('accident_history') || '[]');
    let updated;
    if (isEdit) {
      updated = currentHistory.map((item: any) => item.id === formData.id ? report : item);
    } else {
      updated = [report, ...currentHistory];
    }

    localStorage.setItem('accident_history', JSON.stringify(updated));
    syncCollection('accident_history', updated);

    // Integración CAPA Automático (Task 2.1)
    if (!isEdit) {
      const currentCapas = JSON.parse(localStorage.getItem('ehs_capa_db') || '[]');
      const newCapa = {
        id: `CAPA-${Date.now()}`,
        title: `Investigación Accidente: ${formData.victimaNombre}`,
        description: `Accidente ${formData.gravedad} reportado el ${formData.fecha} en ${formData.ubicacion}.`,
        capaType: 'corrective',
        source: 'incident',
        priority: formData.gravedad === 'Mortal' || formData.gravedad === 'Grave' ? 'critical' : 'high',
        originDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        responsible: '',
        team: [],
        relatedProcess: 'Seguridad Industrial',
        problemStatement: formData.descripcionHecho,
        rootCauseMethod: '5why',
        rootCauseAnalysis: '',
        immediateActions: [],
        correctiveActions: [],
        controlType: '',
        effectivenessCriteria: '',
        status: 'draft',
        createdAt: new Date().toISOString(),
        openedAt: '',
        completedAt: '',
        closedAt: '',
        observations: ''
      };
      const updatedCapas = [newCapa, ...currentCapas];
      localStorage.setItem('ehs_capa_db', JSON.stringify(updatedCapas));
      syncCollection('ehs_capa_db', updatedCapas);
      toast.success('CAPA Borrador creado automáticamente.');
    }

    toast.success(isEdit ? 'Investigación actualizada correctamente.' : 'Investigación guardada correctamente.');

    // Reset and close form
    setFormData({
      fecha: new Date().toISOString().split('T')[0], hora: '', empresa: '', ubicacion: '', gravedad: 'Leve',
      victimaNombre: '', victimaDni: '', victimaPuesto: '', victimaAntiguedad: '', lesion: '', parteCuerpo: '',
      descripcionHecho: '', testigos: [{ nombre: '', declaracion: '' }],
      problemaCentral: '', porques: [''],
      medidas: [{ accion: '', responsable: '', fechaLimite: '' }],
      fotos: [],
      operatorSignature: '', supervisorSignature: '', signature: '',
      showSignatures: { operator: true, professional: true, supervisor: true }
    });
    setIsEdit(false);
    setIsFormVisible(false);
    setCurrentStep(0);
    loadHistory();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const currentHistory = JSON.parse(localStorage.getItem('accident_history') || '[]');
    const updated = currentHistory.filter((item: any) => String(item.id) !== String(deleteTarget));
    localStorage.setItem('accident_history', JSON.stringify(updated));
    syncCollection('accident_history', updated);
    setHistory(updated);
    setDeleteTarget(null);
    toast.success('Investigación eliminada.');
  };

  const handleExportCSV = () => {
    requirePro(() => downloadCSV(history.map((i) => ({
      victima: i.victimaNombre, empresa: i.empresa, fecha: i.date,
      lesion: i.lesion || '', sector: i.ubicacion || '', gravedad: i.gravedad || ''
    })), 'historial_accidentes', {
      victima: 'Víctima', empresa: 'Empresa', fecha: 'Fecha',
      lesion: 'Tipo de Lesión', sector: 'Sector/Área', gravedad: 'Gravedad'
    }));
  };

  if (selectedReport) {
    return (
      <div className="print-only-wrapper">
                <AccidentPdfGenerator report={{ ...selectedReport, id: selectedReport.id || Date.now() }} onBack={() => setSelectedReport(null)} />
            </div>);

  }

  if (!isFormVisible) {
    const columns = [
    {
      header: 'Fecha',
      accessor: 'date',
      sortable: true,
      render: (item: any) =>
      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <Calendar size={14} /> {new Date(item.date || item.fecha).toLocaleDateString('es-AR')}
                    </span>

    },
    {
      header: 'Accidentado',
      accessor: 'victimaNombre',
      sortable: true,
      render: (item: any) =>
      <div className="flex items-center gap-3">
                        <div className="bg-red-500/10 p-2 rounded-lg text-red-500">
                            <AlertTriangle size={16} />
                        </div>
                        <span className="font-bold">{item.victimaNombre}</span>
                    </div>

    },
    {
      header: 'Empresa',
      accessor: 'empresa',
      sortable: true,
      render: (item: any) =>
      <span className="flex items-center gap-1.5">
                        <MapPin size={14} /> {item.empresa}
                    </span>

    },
    {
      header: 'Gravedad',
      accessor: 'gravedad',
      sortable: true,
      render: (item: any) => {
        const cfg = severityConfig[item.gravedad] || { color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
        return (
          <span style={{ background: cfg.bg, color: cfg.color }} className="p-[0.25rem_0.7rem] rounded-[999px] text-[0.72rem] font-[800]">
                            {item.gravedad || '—'}
                        </span>);

      }
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (item: any) =>
                    <div className="flex gap-1.5">
                        <button onClick={() => setSelectedReport(item)} style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }} className="px-3 py-1.5 rounded-[8px] cursor-pointer text-xs font-bold transition-transform hover:-translate-y-0.5 shadow-sm">Ver</button>
                        <button onClick={() => {setFormData(item);setIsEdit(true);setIsFormVisible(true);}} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform" title="Editar"><Pencil size={15} /></button>
                        <button onClick={() => requirePro(() => {const url = `${window.location.origin}/v/${currentUser?.uid}/accident/${item.id}?print=true`;setQrTarget({ text: url, title: `Accidente — ${item.victimaNombre}` });})} style={{ backgroundColor: '#8b5cf6', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform" title="QR"><QrCode size={15} /></button>
                        <button onClick={() => requirePro(() => setShareItem(item))} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform" title="Compartir"><Share2 size={15} /></button>
                        <button onClick={() => setDeleteTarget(item.id)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform"><Trash2 size={15} /></button>
                    </div>

    }];


    return (
      <div className="container w-full max-w-[1200px] mx-auto pb-32">
        <div className="no-print">
          <PremiumHeader
            title="Investigaciones de Accidentes"
            subtitle="Registros de siniestros"
            icon={<AlertTriangle size={36} color="#ffffff" />}
          />
        </div>
        

                {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
                <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`Investigación de Accidente - ${shareItem?.victimaNombre || ''}`} text={shareItem ? `⚠️ Informe de Investigación\n👤 Accidentado: ${shareItem.victimaNombre}\n🏢 Empresa: ${shareItem.empresa}\n📅 Fecha: ${shareItem.fecha}\n⚠️ Gravedad: ${shareItem.gravedad}` : ''} rawMessage={shareItem ? `⚠️ Informe de Investigación\n👤 Accidentado: ${shareItem.victimaNombre}\n🏢 Empresa: ${shareItem.empresa}` : ''} elementIdToPrint="pdf-content" fileName={`Accidente_${shareItem?.victimaNombre || 'Reporte'}.pdf`} />
                <div id="pdf-content" className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
                    {(shareItem || printItem) && <AccidentPdfGenerator report={{ ...(shareItem || printItem), id: (shareItem || printItem).id || Date.now() }} isHeadless={true} />}
                </div>

                <main className="w-full max-w-[1000px] mx-auto pb-8">
                    {/* Botones de Navegación */}
                    <div className="flex gap-[1rem] p-[0_1rem] mb-[1rem]">
                        <></>
                    </div>

                    <div className="flex items-center justify-end gap-4 mb-8 flex-wrap px-4">
                        <div className="flex gap-3">
                            {history.length > 0 &&
                                <button onClick={handleExportCSV} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }} className="flex items-center gap-1.5 border-none rounded-xl px-4 py-2.5 text-xs font-extrabold cursor-pointer text-white transition-transform hover:-translate-y-0.5">
                                    <Download size={14} /> EXCEL
                                </button>
              }
                            <button onClick={() => setIsFormVisible(true)} className="flex items-center gap-2 px-5 py-2.5 w-auto m-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none rounded-xl font-extrabold shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 transition-all cursor-pointer">
                                <Plus size={18} /> NUEVA INVESTIGACIÓN
                            </button>
                        </div>
                    </div>

                <DataTable
            data={history}
            columns={columns}
            searchPlaceholder="Buscar por empleado, empresa o gravedad..."
            searchFields={['victimaNombre', 'empresa', 'gravedad', 'lesion']}
            emptyMessage="No hay investigaciones registradas."
            emptyIcon={<FileText size={48} />} />
          
                </main>
            </div>);

  }

  return (
    <ModuleFormLayout>
        <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`Investigación de Accidente - ${shareItem?.victimaNombre || ''}`} text={shareItem ? `⚠️ Informe de Investigación\n👤 Accidentado: ${shareItem.victimaNombre}\n🏢 Empresa: ${shareItem.empresa}\n📅 Fecha: ${shareItem.fecha}\n⚠️ Gravedad: ${shareItem.gravedad}` : ''} rawMessage={shareItem ? `⚠️ Informe de Investigación\n👤 Accidentado: ${shareItem.victimaNombre}\n🏢 Empresa: ${shareItem.empresa}` : ''} elementIdToPrint="pdf-content" fileName={`Accidente_${shareItem?.victimaNombre || 'Reporte'}.pdf`} />
        
        <div id="pdf-content" className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
            {(shareItem || printItem) && <AccidentPdfGenerator report={{ ...(shareItem || printItem), id: (shareItem || printItem).id || Date.now() }} isHeadless={true} />}
        </div>
        <div className="pt-24 sm:pt-28">
            <ModuleFormToolbar
      title={isEdit ? 'Editar Investigación' : 'Investigación de Accidente'}
      subtitle="Metodología Árbol de Causas"
      icon={<AlertTriangle />}
      onBack={isFormVisible ? () => {setIsFormVisible(false);} : undefined} />
      

            <main className="w-full max-w-[1000px] mx-auto px-6 pb-8 pt-0">
                {/* Actualización Normativa */}
                <div className="mb-10 mt-2 p-5 rounded-2xl bg-[#e0f2fe] border border-cyan-300 shadow-sm flex gap-4 items-start">
                    <Sparkles size={24} color="#0284c7" className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="m-0 mb-1.5 text-black text-[1rem] font-extrabold">
                            Metodología Avalada: Res. SRT 7/2026 y Dec. 549/2025
                        </h4>
                        <p className="m-0 text-slate-900 text-[0.9rem] font-medium leading-relaxed">
                            El presente análisis de causas y recolección testimonial se estructura para conformar prueba sólida frente a Comisiones Médicas, cumpliendo exigencias del Nuevo Protocolo de Valoración del Daño Corporal y nuevo baremo vigente.
                        </p>
                    </div>
                </div>

                {/* Stepper */}
                <div className="flex justify-between mb-10 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700 z-0 -translate-y-1/2" />
                    {SECTIONS.map((section, index) =>
          <div key={index} className="flex flex-col items-center z-10 gap-2 cursor-pointer" onClick={() => setCurrentStep(index)}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${currentStep > index ? 'bg-emerald-500 border-emerald-500 text-white' : currentStep === index ? 'bg-blue-600 border-blue-600 text-white scale-125 shadow-lg shadow-blue-500/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                                {currentStep > index ? <CheckCircle2 size={16} /> : index + 1}
                            </div>
                            <span className={`text-xs text-center max-w-[80px] hidden sm:inline ${currentStep === index ? 'font-extrabold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded shadow-sm' : 'font-medium text-slate-500 dark:text-slate-400'}`}>{section}</span>
                        </div>
          )}
                </div>

                {currentStep !== 5 && (
                <div className="flex-1 p-4 md:p-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-xl">
                    <ModuleFormSection title={SECTIONS[currentStep] || ''} icon={<FileText />}>
                        <div className="mb-4" />

                    {currentStep === 0 &&
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha del Suceso</label>
                                <input type="date" value={formData.fecha} onChange={(e) => handleInputChange('fecha', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hora Aprox.</label>
                                <input type="time" value={formData.hora} onChange={(e) => handleInputChange('hora', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Razón Social / Empresa</label>
                                <input type="text" placeholder="Ej. Constructora SRL" value={formData.empresa} onChange={(e) => handleInputChange('empresa', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ubicación / Sector</label>
                                <input type="text" placeholder="Ej. Obra Centro, Sector Hormigonado" value={formData.ubicacion} onChange={(e) => handleInputChange('ubicacion', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gravedad Estimada</label>
                                <select value={formData.gravedad} onChange={(e) => handleInputChange('gravedad', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm">
                                    <option value="Leve">Leve (Sin baja)</option>
                                    <option value="Moderado">Moderado (Con baja médica corta)</option>
                                    <option value="Grave">Grave (Internación, amputaciones)</option>
                                    <option value="Mortal">Mortal</option>
                                </select>
                            </div>
                        </div>
          }

                    {currentStep === 1 &&
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre del Accidentado</label>
                                <input type="text" placeholder="Nombre completo" value={formData.victimaNombre} onChange={(e) => handleInputChange('victimaNombre', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">DNI / CUIL</label>
                                <input type="text" placeholder="Sin guiones" value={formData.victimaDni} onChange={(e) => handleInputChange('victimaDni', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Puesto / Tarea</label>
                                <input type="text" placeholder="Ej. Oficial Albañil" value={formData.victimaPuesto} onChange={(e) => handleInputChange('victimaPuesto', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Antigüedad en el puesto</label>
                                <input type="text" placeholder="Ej. 2 años" value={formData.victimaAntiguedad} onChange={(e) => handleInputChange('victimaAntiguedad', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Lesión</label>
                                <input type="text" placeholder="Ej. Corte profundo, contusión, fractura..." value={formData.lesion} onChange={(e) => handleInputChange('lesion', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Parte del Cuerpo Afectada</label>
                                <input type="text" placeholder="Ej. Mano derecha indíce" value={formData.parteCuerpo} onChange={(e) => handleInputChange('parteCuerpo', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                            </div>
                        </div>
          }

                    {currentStep === 2 &&
          <div className="flex flex-col gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descripción detallada del Hecho (¿Qué pasó?)</label>
                                <div className="relative flex items-center w-full">
                                    <textarea
                                        className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm min-h-[120px] resize-y"
                                        placeholder="Relato detallado de cómo ocurrió el accidente, basado en los testimonios y evidencias iniciales..."
                                        value={formData.descripcionHecho}
                                        onChange={(e) => handleInputChange('descripcionHecho', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleVoiceDictation}
                                        className={`absolute right-3 bottom-3 p-2.5 rounded-lg border-none cursor-pointer transition-all ${
                                            isListeningVoice 
                                                ? 'bg-red-500 text-white animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                                                : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                                        }`}
                                        title="Dictar con Voz"
                                    >
                                        {isListeningVoice ? <MicOff size={16} /> : <Mic size={16} />}
                                    </button>
                                </div>
                            </div>

                            <AdjuntosSection
              adjuntos={formData.fotos || []}
              onAdd={(b64) => setFormData((prev: any) => ({ ...prev, fotos: [...(prev.fotos || []), b64] }))}
              onRemove={(idx) => setFormData((prev: any) => ({ ...prev, fotos: (prev.fotos || []).filter((_: any, i: number) => i !== idx) }))}
              accentColor="#3b82f6" />
            

                            <div className="flex justify-between items-center mt-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                <h3 className="text-lg m-0 text-blue-600 dark:text-blue-400 font-bold">Testigos del Hecho</h3>
                                <button className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-sm hover:opacity-80" 
                                        style={{ backgroundColor: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }}
                                        onClick={() => addArrayItem('testigos', { nombre: '', declaracion: '' })}>
                                    <UserPlus size={16} /> Añadir Testigo
                                </button>
                            </div>

                            {formData.testigos.map((t: any, i: number) =>
            <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 relative">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider m-0">Nombre del Testigo {i + 1}</label>
                                        {formData.testigos.length > 1 &&
                                            <button
                                                onClick={() => removeArrayItem('testigos', i)}
                                                className="flex items-center justify-center border-none p-2 rounded-lg cursor-pointer transition-colors shadow-sm hover:opacity-80"
                                                style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}
                                                title="Eliminar Testigo">
                                                <Trash2 size={16} />
                                            </button>
                                        }
                                    </div>
                                    <input type="text" placeholder="Nombre completo o cargo" value={t.nombre} onChange={(e) => handleArrayChange('testigos', i, 'nombre', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm mb-4" />
                                    
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Declaración Breve</label>
                                    <textarea placeholder="Lo que presenció..." value={t.declaracion} onChange={(e) => handleArrayChange('testigos', i, 'declaracion', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm min-h-[80px] resize-y" />
                                </div>
            )}
                        </div>
          }

                    {currentStep === 3 &&
          <div className="flex flex-col gap-6">
                            <div className="bg-[#e0f2fe] p-6 rounded-2xl border border-cyan-300 shadow-sm text-sm text-slate-900 font-medium">
                                <div className="flex items-center gap-2 font-extrabold mb-2 text-black text-[1rem]">
                                    <Search size={20} color="#0284c7" /> Metodología de los "5 Porqués"
                                </div>
                                Técnica sistemática para iterar preguntando "¿Por qué ocurrió?" hasta llegar a la causa raíz sistémica o de gestión, evitando culpar únicamente al error humano.
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">El Problema (Efecto Final)</label>
                                <input type="text" placeholder="Ej. El trabajador se cortó la mano con la amoladora" value={formData.problemaCentral} onChange={(e) => handleInputChange('problemaCentral', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm font-bold" />
                            </div>

                            <div className="mt-4 border-l-4 border-blue-600 pl-6 flex flex-col gap-4">
                                {formData.porques.map((pq: string, i: number) =>
              <div key={i} className="bg-[rgba(255,255,255,0.03)] p-[1.5rem] rounded-[16px] border-[1px_solid_var(--glass-border)]">
                                        <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-emerald-600">¿Por qué? (Nivel {i + 1})</label>
                                        <div className="flex gap-4 items-center">
                                            <input type="text" placeholder="Respuesta al porqué anterior..." value={pq} onChange={(e) => handleArrayChange('porques', i, null, e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm mb-0" />
                                            {formData.porques.length > 1 &&
                  <button
                    onClick={() => removeArrayItem('porques', i)}
                    className="bg-red-500/10 text-red-500 border-none p-3 rounded-xl cursor-pointer flex-shrink-0 hover:bg-red-500/20 transition-colors"
                    title="Eliminar Porqué">
                    
                                                    <Trash2 size={16} />
                                                </button>
                  }
                                        </div>
                                    </div>
              )}
                                {formData.porques.length < 5 &&
              <button className="flex items-center gap-2 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer self-start mt-2" onClick={() => addArrayItem('porques', '')}>
                                        <ListPlus size={16} /> Preguntar otro "¿Por qué?"
                                    </button>
              }
                            </div>
                        </div>
          }

                    {currentStep === 4 &&
          <div className="flex flex-col gap-6">
                            <p className="m-0 text-slate-500 dark:text-slate-400 text-[0.95rem]">
                                En base a la causa raíz detectada, defina el Plan de Acción Correctivo/Preventivo para asegurar que no vuelva a ocurrir.
                            </p>

                            {formData.medidas.map((m: any, i: number) =>
            <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 relative">
                                    {formData.medidas.length > 1 &&
              <button
                onClick={() => removeArrayItem('medidas', i)}
                className="absolute top-4 right-4 bg-red-500/10 text-red-500 border-none p-2 rounded-lg cursor-pointer hover:bg-red-500/20 transition-colors"
                title="Eliminar Medida">
                
                                            <Trash2 size={16} />
                                        </button>
              }
                                    
                                    <div className="mb-[1rem]">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Acción Correctiva / Preventiva</label>
                                        <input type="text" placeholder="Ej. Instalar guardas fijas, dar capacitación" value={m.accion} onChange={(e) => handleArrayChange('medidas', i, 'accion', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                                    </div>

                                    <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem]">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Responsable</label>
                                            <input type="text" placeholder="Ej. Jefe de Mantenimiento" value={m.responsable} onChange={(e) => handleArrayChange('medidas', i, 'responsable', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha Límite</label>
                                            <input type="date" value={m.fechaLimite} onChange={(e) => handleArrayChange('medidas', i, 'fechaLimite', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                                        </div>
                                    </div>
                                </div>
            )}

                            <button className="btn-outline hover-lift p-[0.8rem] text-[0.85rem] w-[100%] justify-center rounded-[12px]" onClick={() => addArrayItem('medidas', { accion: '', responsable: '', fechaLimite: '' })}>
                                <Plus size={16} /> Añadir otra Medida
                            </button>
                        </div>
          }
                    </ModuleFormSection>
                </div>
                )}

                {/* Navegación Inferior Responsive */}
                <div className="flex justify-center mt-8 gap-4 pb-8">
                    {currentStep > 0 && currentStep < 5 &&
                    <button
            className="px-5 py-2.5 border-none rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer transition-all shadow-sm"
            onClick={handlePrev}
            style={{ backgroundColor: '#94a3b8', color: '#ffffff' }}>
            
                        <ChevronLeft size={16} /> Atrás
                    </button>
                    }

                    {currentStep < SECTIONS.length - 1 &&
          <button className="px-5 py-2.5 border-none rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer transition-all shadow-md hover:-translate-y-0.5" 
                  style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
                  onClick={handleNext}>
                            Siguiente <ChevronRight size={16} />
                        </button>
          }
                </div>

                {/* Firmas y Autorizaciones */}
                {currentStep === 5 && (
                <ModuleFormSection title="Firmas y Autorizaciones" icon={<Pencil />}>
                    <div className="no-print mb-8 p-6 bg-[rgba(30,_41,_59,_0.2)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] w-[100%] flex flex-col gap-[1.25rem] justify-center items-center">
                        <div className="text-[var(--color-text)] font-[800] text-[0.85rem] uppercase letter-spacing-[0.5px]">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                        <div className="flex gap-[1rem] flex-wrap justify-center">
                            {[
              { id: 'operator', label: 'Accidentado / Testigo' },
              { id: 'professional', label: 'Profesional HYS' },
              { id: 'supervisor', label: 'Supervisor / Empleador' }].
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
                      onChange={(e) => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))} className="hidden" />

                    
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

                    <div className="mb-[2.5rem]">
                        <PdfSignatures
              data={{
                ...formData,
                professionalSignature: professional.signature,
                professionalName: professional.name,
                professionalLicense: professional.license,
                professionalStamp: professional.stamp
              }}
              box1={showSignatures.operator ? {
                title: 'ACCIDENTADO / TESTIGO',
                subtitle: 'Declaración y firma',
                signatureUrl: formData.operatorSignature || null,
                isProfessional: false
              } : null}
              box2={showSignatures.professional ? {
                title: 'PROFESIONAL H&S',
                subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                signatureUrl: formData.professionalSignature || professional.signature || null,
                stampUrl: formData.professionalStamp || professional.stamp || null,
                isProfessional: true,
                license: professional.license
              } : null}
              box3={showSignatures.supervisor ? {
                title: 'SUPERVISOR / EMPLEADOR',
                subtitle: 'Validación del informe',
                signatureUrl: formData.supervisorSignature || formData.signature || null,
                isProfessional: false
              } : null} />
            
            <PdfBrandingFooter />
                    </div>

                    <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {showSignatures.operator &&
            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas
                onSave={(sig) => setFormData((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                initialImage={formData.operatorSignature}
                title="Firma del Accidentado / Testigo" />
              
                            </div>
            }
                        
                        {showSignatures.professional &&
            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas
                onSave={(sig) => setFormData((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                initialImage={formData.professionalSignature || professional.signature}
                title="Firma de Profesional Actuante" />
              
                            </div>
            }

                        {showSignatures.supervisor &&
            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas
                onSave={(sig) => setFormData((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                initialImage={formData.supervisorSignature || formData.signature}
                title="Firma de Supervisor / Empleador" />
              
                            </div>
            }
                    </div>
                </ModuleFormSection>
                )}
            </main>

            {currentStep === 5 && (
            <div className="flex flex-row justify-center gap-2 mt-4 w-full px-2">
                <button
                    className="px-4 py-2 text-white border-none rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-md hover:shadow-lg cursor-pointer"
                    style={{ backgroundColor: '#10b981' }}
                    onClick={() => requirePro(handleSave)}>
                    <Save size={16} /> <span className="hidden sm:inline">GUARDAR</span>
                </button>
                <button
                    className="px-4 py-2 text-white border-none rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-md hover:shadow-lg cursor-pointer"
                    style={{ backgroundColor: '#6366f1' }}
                    onClick={() => requirePro(() => setShareItem(formData))}>
                    <Share2 size={16} /> <span className="hidden sm:inline">COMPARTIR</span>
                </button>
                <button
                    className="px-4 py-2 text-white border-none rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-md hover:shadow-lg cursor-pointer"
                    style={{ backgroundColor: '#0ea5e9' }}
                    onClick={() => {
                        setPrintItem(formData);
                        setTimeout(() => {
                            window.print();
                            setTimeout(() => setPrintItem(null), 10000);
                        }, 500);
                    }}>
                    <Printer size={16} /> <span className="hidden sm:inline">IMPRIMIR</span>
                </button>
            </div>
            )}
        </div>
        </ModuleFormLayout>);

}