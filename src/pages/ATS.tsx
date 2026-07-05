import {
  useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Save, Plus, Trash2, Printer,
  ShieldCheck, Building2, User, Calendar,
  CheckCircle2, AlertCircle, HelpCircle, Pencil, Info, Share2, Sparkles, Loader2,
  MapPin, FileText, Search, QrCode, Download, ClipboardList,
  HardHat, Ear, Search as SearchIcon, Eye as EyeIcon, Edit3 as EditIcon, Trash2 as TrashIcon, Camera as CameraIcon, CheckCircle2 as CheckIcon, ShieldAlert, Zap, Thermometer, Wind as WindIcon, Activity
} from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { downloadCSV } from '../services/exportCsv';
import QRModal from '../components/QRModal';
import { useAuth } from '../contexts/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useSync } from '../contexts/SyncContext';
import { auth } from '../firebase';
import ShareModal from '../components/ShareModal';
import ConfirmModal from '../components/ConfirmModal';
import ATSPdfGenerator from '../components/ATSPdfGenerator';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import CompanyLogo from '../components/CompanyLogo';
import PdfSignatures from '../components/PdfSignatures';
import SignatureCanvas from '../components/SignatureCanvas';
import { API_BASE_URL } from '../config';
import AdModal from '../components/ads/AdModal';
import { getErrorMessage } from '../utils/errorUtils';
import {
  ModuleFormLayout,
  ModuleFormToolbar,
  ModuleFormDocument,
  ModuleFormSection,
  ModuleWizardFooter,
} from '../components/module';

const ATS_WIZARD_STEPS = ['Datos', 'Tareas', 'EPPs & Fotos', 'Checklist', 'Firmas'];

const printStyles = `
@media print {
    .no-print { display: none !important; }
    .print-area { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
    .checklist-print-box { display: flex !important; gap: 4px !important; }
}
`;

const defaultChecklist = [
// General
{ id: 1, categoria: 'General', pregunta: '¿Se cuenta con el Programa de Seguridad aprobado por ART?', estado: 'Cumple', observaciones: '' },
{ id: 2, categoria: 'General', pregunta: '¿Se realizó charla de seguridad previa a la tarea (5 min)?', estado: 'Cumple', observaciones: '' },
{ id: 3, categoria: 'General', pregunta: '¿La zona de trabajo está señalizada y delimitada?', estado: 'Cumple', observaciones: '' },
{ id: 4, categoria: 'General', pregunta: '¿Se verificó el estado de máquinas y herramientas a utilizar?', estado: 'Cumple', observaciones: '' },
{ id: 5, categoria: 'General', pregunta: '¿El personal fue capacitado para esta tarea específica?', estado: 'Cumple', observaciones: '' },

// EPP y Calzado
{ id: 6, categoria: 'EPP y Calzado', pregunta: '¿Se dispone de los EPP necesarios (Casco, Anteojos, Guantes)?', estado: 'Cumple', observaciones: '' },
{ id: 7, categoria: 'EPP y Calzado', pregunta: '¿El calzado de seguridad es el adecuado para el terreno/riesgo?', estado: 'Cumple', observaciones: '' },
{ id: 8, categoria: 'EPP y Calzado', pregunta: '¿Los EPP se encuentran en buen estado de conservación?', estado: 'Cumple', observaciones: '' },

// Instalaciones Eléctricas
{ id: 9, categoria: 'Instalaciones Eléctricas', pregunta: '¿El tablero eléctrico cuenta con disyuntor y térmicas?', estado: 'Cumple', observaciones: '' },
{ id: 10, categoria: 'Instalaciones Eléctricas', pregunta: '¿Se verificó la puesta a tierra de los equipos?', estado: 'Cumple', observaciones: '' },
{ id: 11, categoria: 'Instalaciones Eléctricas', pregunta: '¿Los cables y prolongaciones están sin empalmes precarios?', estado: 'Cumple', observaciones: '' },

// Trabajo en Altura
{ id: 12, categoria: 'Trabajo en Altura', pregunta: '¿Se utiliza arnés de seguridad de cuerpo completo (si >2m)?', estado: 'N/A', observaciones: '' },
{ id: 13, categoria: 'Trabajo en Altura', pregunta: '¿El punto de anclaje es estructural y lo suficientemente fuerte?', estado: 'N/A', observaciones: '' },
{ id: 14, categoria: 'Trabajo en Altura', pregunta: '¿Las escaleras/andamios están nivelados y asegurados?', estado: 'N/A', observaciones: '' },
{ id: 15, categoria: 'Trabajo en Altura', pregunta: '¿Se ha delimitado el área inferior para evitar golpes por caída de objetos?', estado: 'N/A', observaciones: '' },

// Orden y Limpieza
{ id: 16, categoria: 'Orden y Limpieza', pregunta: '¿Se mantienen los pasillos y vías de escape despejadas?', estado: 'Cumple', observaciones: '' },
{ id: 17, categoria: 'Orden y Limpieza', pregunta: '¿Existen recipientes para la disposición de residuos?', estado: 'Cumple', observaciones: '' },
{ id: 18, categoria: 'Orden y Limpieza', pregunta: '¿Se almacenan los materiales de forma estable y segura?', estado: 'Cumple', observaciones: '' },
{ id: 19, categoria: 'Orden y Limpieza', pregunta: '¿Se dispone de iluminación adecuada en el área?', estado: 'Cumple', observaciones: '' }];


const PRESETS = {
  'Andamios (Altura)': [
  { id: 101, paso: 'Verificación de nivelación y apoyos de andamio', riesgo: 'Caída de estructura / Desnivel', control: 'Uso de durmientes y nivelación con burbuja', realizado: false },
  { id: 102, paso: 'Montaje de tablones y barandas de seguridad', riesgo: 'Caída de personas u objetos', control: 'Doble baranda y rodapié reglamentario', realizado: false },
  { id: 103, paso: 'Anclaje de arnés a punto estructural', riesgo: 'Caída a distinto nivel', control: 'Arnés de cuerpo completo y doble cabo de vida', realizado: false }],

  'Soldadura (Caliente)': [
  { id: 201, paso: 'Inspección de equipo y pinzas', riesgo: 'Contacto eléctrico / Incendio', control: 'Verificación de aislación y puesta a tierra', realizado: false },
  { id: 202, paso: 'Colocación de biombos y despeje de área', riesgo: 'Proyección de partículas / Irradiación', control: 'Careta fotosensible y vestimenta de cuero ignífugo', realizado: false },
  { id: 203, paso: 'Vigilancia de chispas post-tarea', riesgo: 'Principio de incendio latente', control: 'Matafuego ABC a mano y guardia de cenizas (30 min)', realizado: false }],

  'Excavación (Zanjas)': [
  { id: 301, paso: 'Detección de interferencias', riesgo: 'Rotura de servicios / Explosión', control: 'Cateo manual previo y chequeo de planos', realizado: false },
  { id: 302, paso: 'Señalización perimetral', riesgo: 'Caída de personas o vehículos', control: 'Cerco rígido y balizamiento nocturno', realizado: false },
  { id: 303, paso: 'Excavación y entibado', riesgo: 'Derrumbe de paredes', control: 'Perfilado/Escalonamiento de talud según tipo de suelo', realizado: false }],

  'Corte Eléctrico (LOTO)': [
  { id: 401, paso: 'Identificación de tablero y circuitos', riesgo: 'Corte erróneo', control: 'Uso de diagramas unifilares actualizados', realizado: false },
  { id: 402, paso: 'Maniobra de corte y bloqueo (LOTO)', riesgo: 'Energización accidental', control: 'Colocación de candado personal y tarjeta de peligro', realizado: false },
  { id: 403, paso: 'Verificación de ausencia de tensión', riesgo: 'Electrocución por tensión residual', control: 'Uso de multímetro/detector de tensión homologado', realizado: false }],

  'Espacio Confinado': [
  { id: 501, paso: 'Medición de gases previa', riesgo: 'Asfixia / Intoxicación / Explosión', control: 'Uso de explosímetro calibrado multigas', realizado: false },
  { id: 502, paso: 'Ventilación mecánica', riesgo: 'Acumulación de vapores', control: 'Extractor/Insuflador portátil continuo', realizado: false },
  { id: 503, paso: 'Ingreso supervisado', riesgo: 'Atrapamiento / Desvanecimiento', control: 'Vigía permanente en boca de hombre y trípode de rescate', realizado: false }]

};

export default function ATS(): React.ReactElement | null {
  const navigate = useNavigate();
  const location = useLocation();
  const { requirePro, isPro, daysRemaining } = usePaywall();
  const { syncCollection, syncPulse } = useSync();
  const { currentUser } = useAuth();
  const editData = location.state?.editData;
  useDocumentTitle(editData ? 'Editar ATS' : 'Análisis de Trabajo Seguro (ATS)');

  // History State
  const [showForm, setShowForm] = useState(location.pathname.includes('/nuevo'));

  useEffect(() => {
    const isNew = location.pathname.includes('/nuevo');
    setShowForm(isNew);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const [history, setHistory] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', payload: null as any });
  const [qrTarget, setQrTarget] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    empresa: '',
    cuit: '',
    obra: '',
    tarea: '',
    fecha: new Date().toISOString().split('T')[0],
    capatazNombre: '',
    operatorSignature: '',
    capatazSignature: '',
    checklist: defaultChecklist,
    tareas: [
    { id: 1, paso: 'Preparación de área', riesgo: 'Caídas', control: 'Delimitación', nivelRiesgo: 'Medio', realizado: true },
    { id: 2, paso: 'Ejecución de tarea', riesgo: 'Golpes', control: 'Uso de EPP', nivelRiesgo: 'Bajo', realizado: false }
  ],
  epps: [],
  fotos: []

  });

  const [showSignatures, setShowSignatures] = useState({
    operator: true,
    supervisor: true,
    professional: true
  });

  const [showShare, setShowShare] = useState(false);
  const [isGeneratingATS, setIsGeneratingATS] = useState(false);
  const [isVisionATS, setIsVisionATS] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiTaskInput, setAiTaskInput] = useState('');
  const [isAdModalOpen, setIsAdModalOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const nextStep = () => {if (currentStep < totalSteps) {setCurrentStep((c) => c + 1);window.scrollTo(0, 0);}};
  const prevStep = () => {if (currentStep > 1) {setCurrentStep((c) => c - 1);window.scrollTo(0, 0);}};

  const handleGenerateAI = () => {
    setAiTaskInput('');
    setShowAIModal(true);
  };

  const runAIGeneration = async () => {
    const taskTitle = aiTaskInput.trim();
    if (!taskTitle) return;
    setShowAIModal(false);

    setIsGeneratingATS(true);
    const loadingToast = toast.loading('Calculando pasos, riesgos y protocolos...');

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai-ats-generator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken(true)}`
        },
        body: JSON.stringify({ taskTitle })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Fallo en la conexión');
      }

      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('La respuesta de la IA no tiene el formato correcto');
      }

      // Map AI result to internal task structure
      const newTasks = data.map((item, index) => ({
        id: Date.now() + index,
        paso: item.paso || '',
        riesgo: item.riesgo || '',
        control: item.control || '',
        nivelRiesgo: item.nivelRiesgo || 'Medio',
        realizado: false
      }));

      setFormData((prev) => ({
        ...prev,
        tareas: newTasks
      }));

      toast.success('ATS Autocompletado con IA ✨', { id: loadingToast });
    } catch (error) {
      console.error('Error generating ATS:', error);
      toast.error(`Error al generar: ${getErrorMessage(error)}`, { id: loadingToast });
    } finally {
      setIsGeneratingATS(false);
    }
  };

  const handleVisionUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    requirePro(async () => {
      setIsVisionATS(true);
      const loadingToast = toast.loading('Analizando foto con IA...');

      try {
        // Convert to Base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const imageBase64 = reader.result as string;

          const res = await fetch(`${API_BASE_URL}/api/vision-ats`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await auth.currentUser?.getIdToken(true)}`
            },
            body: JSON.stringify({ imageBase64 })
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Fallo en la conexión');
          }

          const data = await res.json();

          if (!Array.isArray(data) || data.length === 0) {
            throw new Error('La respuesta de la IA no tiene el formato correcto');
          }

          const newTasks = data.map((item, index) => ({
            id: Date.now() + index,
            paso: item.paso || '',
            riesgo: item.riesgo || '',
            control: item.control || '',
            nivelRiesgo: item.nivelRiesgo || 'Medio',
            realizado: false
          }));

          setFormData((prev) => ({
            ...prev,
            tareas: newTasks
          }));

          toast.success('ATS completado desde foto ✨', { id: loadingToast });
          setIsVisionATS(false);
        };
        reader.onerror = () => {
          throw new Error('Error al leer el archivo');
        };
      } catch (error) {
        console.error('Error generating vision ATS:', error);
        toast.error(`Error al generar: ${getErrorMessage(error)}`, { id: loadingToast });
        setIsVisionATS(false);
      }
    });
    
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const applyPresetTasks = (name) => {
    const tasks = PRESETS[name];
    setFormData((prev) => ({
      ...prev,
      tareas: tasks.map((t, i) => ({ ...t, id: Date.now() + i }))
    }));
    toast.success(`Plantilla de ${name} aplicada.`);
  };

  const handleApplyPreset = (name) => {
    const tasks = PRESETS[name];
    if (!tasks) return;

    if (formData.tareas.length > 2) {
      setConfirmModal({ isOpen: true, type: 'template', payload: name });
      return;
    }

    applyPresetTasks(name);
  };

  const executeClearForm = () => {
    setFormData({
      id: '',
      empresa: '', cuit: '', obra: '', tarea: '',
      fecha: new Date().toISOString().split('T')[0],
      capatazNombre: '',
      operatorSignature: '',
      capatazSignature: '',
      checklist: defaultChecklist,
      tareas: [],
      epps: [],
      fotos: []
    });
    toast.success('Formulario reiniciado');
  };

  const handleClearForm = () => {
    setConfirmModal({ isOpen: true, type: 'clear', payload: null });
  };

  const [professional, setProfessional] = useState({
    name: 'Juan Pérez',
    license: '',
    signature: null
  });

  // Cargar historial
  useEffect(() => {
    const historyRaw = localStorage.getItem('ats_history');
    if (historyRaw) setHistory(JSON.parse(historyRaw));
  }, [syncPulse]);

  // Cargar datos del profesional
  useEffect(() => {
    const savedData = localStorage.getItem('personalData');
    const savedSigData = localStorage.getItem('signatureStampData');
    const legacySignature = localStorage.getItem('capturedSignature');

    let signature = legacySignature || null;
    if (savedSigData) {
      const parsed = JSON.parse(savedSigData);
      signature = parsed.signature || signature;
    }

    if (savedData) {
      const data = JSON.parse(savedData);
      setProfessional({
        name: data.name || 'Juan Pérez',
        license: data.license || '',
        signature: signature
      });
    } else {
      setProfessional((prev) => ({ ...prev, signature }));
    }
  }, []);

  const updateChecklist = (id, field, value) => {
    const newList = formData.checklist.map((item) =>
    item.id === id ? { ...item, [field]: value } : item
    );
    setFormData({ ...formData, checklist: newList });
  };

  const addQuestion = (categoria) => {
    const newId = Math.max(0, ...formData.checklist.map((i) => i.id)) + 1;
    const newQuestion = { id: newId, categoria, pregunta: 'Nueva Pregunta', estado: 'Cumple', observaciones: '' };
    setFormData({ ...formData, checklist: [...formData.checklist, newQuestion] });
  };

  const removeQuestion = (id) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.filter((item) => item.id !== id)
    });
  };

  const updateTask = (id, field, value) => {
    const newTasks = formData.tareas.map((t) =>
    t.id === id ? { ...t, [field]: value } : t
    );
    setFormData({ ...formData, tareas: newTasks });
  };

  const addTask = () => {
    const newId = Math.max(0, ...formData.tareas.map((t) => t.id)) + 1;
    const newTask = { id: newId, paso: '', riesgo: '', control: '', nivelRiesgo: 'Bajo', realizado: false };
    setFormData({ ...formData, tareas: [...formData.tareas, newTask] });
  };

  const removeTask = (id) => {
    setFormData({
      ...formData,
      tareas: formData.tareas.filter((t) => t.id !== id)
    });
  };

  const updateCategoryName = (oldName, newName) => {
    if (!newName.trim() || oldName === newName) return;
    const newList = formData.checklist.map((item) =>
    item.categoria === oldName ? { ...item, categoria: newName } : item
    );
    setFormData({ ...formData, checklist: newList });
  };

  const handleSave = async () => {
    const historyRaw = localStorage.getItem('ats_history');
    const history = historyRaw ? JSON.parse(historyRaw) : [];
    const entryId = formData.id || Date.now().toString();
    const newEntry = {
      ...formData,
      id: entryId,
      showSignatures: showSignatures,
      professionalSignature: professional.signature,
      professionalName: professional.name,
      professionalLicense: professional.license
    };

    let updated;
    if (formData.id) {
      updated = history.map((h) => h.id === entryId ? newEntry : h);
    } else {
      updated = [newEntry, ...history];
    }

    localStorage.setItem('ats_history', JSON.stringify(updated));
    setHistory(updated);
    await syncCollection('ats_history', updated);
    toast.success('Análisis de Trabajo Seguro guardado con éxito');
    setShowForm(false);
    navigate('/ats');
  };

  const handleShare = () => requirePro(() => setShowShare(true));
  const handlePrint = () => {
    requirePro(() => {
      const element = document.getElementById('pdf-content');
      if (!element) {
        toast.error('No se pudo generar el documento para imprimir.');
        return;
      }
      document.body.classList.add('printing-isolated');
      element.classList.add('isolated-print-target');

      const cleanup = () => {
        document.body.classList.remove('printing-isolated');
        element.classList.remove('isolated-print-target');
        window.removeEventListener('afterprint', cleanup);
        window.removeEventListener('focus', cleanup);
      };

      window.addEventListener('afterprint', cleanup);
      window.addEventListener('focus', cleanup);

      // Small timeout for browsers where print() is entirely synchronous and doesn't fire focus
      setTimeout(cleanup, 1500);
      window.print();
    });
  };


  // Grouping checklist by category
  const categories = [...new Set(formData.checklist.map((i) => i.categoria))];

  // --- Progress tracking ---
  const progressItems = [
  { label: 'Empresa', done: !!formData.empresa?.trim() },
  { label: 'Obra/Ubicación', done: !!formData.obra?.trim() },
  { label: 'Descripción de tarea', done: !!formData.tarea?.trim() },
  { label: 'Responsable', done: !!formData.capatazNombre?.trim() },
  { label: 'Secuencia de tareas', done: formData.tareas.length > 0 && formData.tareas.every((t) => t.paso?.trim() && t.riesgo?.trim()) },
  { label: 'Checklist preventivo', done: formData.checklist.every((c) => c.estado !== '') }];

  const completedCount = progressItems.filter((p) => p.done).length;
  const progressPct = Math.round(completedCount / progressItems.length * 100);
  const progressLabel = progressPct === 100 ? 'Listo para guardar ✅' : progressPct >= 66 ? 'Casi completo' : progressPct >= 33 ? 'En progreso' : 'Pendiente';
  const progressColor = progressPct === 100 ? '#10b981' : progressPct >= 66 ? '#f59e0b' : progressPct >= 33 ? '#3b82f6' : '#94a3b8';

  const executeConfirmAction = () => {
    if (confirmModal.type === 'delete') {
      const updated = history.filter((item: any) => item.id !== confirmModal.payload);
      setHistory(updated);
      localStorage.setItem('ats_history', JSON.stringify(updated));
      syncCollection('ats_history', updated);
      toast.success('ATS eliminado del historial');
    } else if (confirmModal.type === 'template') {
      applyPresetTasks(confirmModal.payload);
    } else if (confirmModal.type === 'clear') {
      executeClearForm();
    }
    setConfirmModal({ isOpen: false, type: '', payload: null });
  };

  const handleExportCSV = () => {
    requirePro(() => {
      downloadCSV(history.map((i: any) => ({
        empresa: i.empresa, obra: i.obra, fecha: i.fecha,
        responsable: i.capatazNombre || '', tarea: i.tarea || ''
      })), 'ats_historial', {
        empresa: 'Empresa', obra: 'Obra/Proyecto', fecha: 'Fecha',
        responsable: 'Responsable', tarea: 'Tarea'
      });
    });
  };

  const columns = [
  {
    header: 'Fecha',
    accessor: 'fecha',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-[0.4rem] text-[var(--color-text-muted)] white-space-[nowrap]">
                    <Calendar size={14} /> {item.fecha}
                </span>

  },
  {
    header: 'Empresa',
    accessor: 'empresa',
    sortable: true,
    render: (item: any) =>
    <div className="flex items-center gap-[0.8rem]">
                    <div className="bg-[rgba(16,185,129,0.1)] p-[0.5rem] rounded-[8px] text-[var(--color-secondary)]">
                        <ClipboardList size={16} />
                    </div>
                    <div className="font-[700]">{item.empresa || 'Sin nombre'}</div>
                </div>

  },
  {
    header: 'Obra / Proyecto',
    accessor: 'obra',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-[0.4rem]">
                    <Building2 size={14} /> {item.obra || '—'}
                </span>

  },
  {
    header: 'Responsable',
    accessor: 'capatazNombre',
    render: (item: any) => <span className="text-[var(--color-text-muted)]">{item.capatazNombre || '—'}</span>
  },
  {
    header: 'Acciones',
    accessor: 'id',
    render: (item: any) =>
    <div className="flex items-center gap-1.5">
                    <button onClick={() => {setFormData(item);setShowForm(true);}} title="Ver" style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform"><FileText size={16} /></button>
                    <button onClick={() => requirePro(() => {const url = `${window.location.origin}/v/${currentUser?.uid}/ats/${item.id}?print=true`;setQrTarget({ text: url, title: `ATS — ${item.empresa}` } as any);})} title="QR" style={{ backgroundColor: '#8b5cf6', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform"><QrCode size={16} /></button>
                    <button onClick={() => requirePro(() => setShareItem(JSON.parse(localStorage.getItem('ats_' + item.id) || 'null') || item))} title="Compartir" style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform"><Share2 size={16} /></button>
                    <button onClick={() => setConfirmModal({ isOpen: true, type: 'delete', payload: item.id })} title="Eliminar" style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform"><Trash2 size={16} /></button>
                </div>

  }];


  const filteredHistory = history.filter((e: any) => {
    const query = searchTerm.toLowerCase();
    return (e.empresa || '').toLowerCase().includes(query) ||
    (e.obra || '').toLowerCase().includes(query) ||
    (e.capatazNombre || '').toLowerCase().includes(query);
  });

  return (
    <>
            <style>{printStyles}</style>
            <AdModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        adSlot="ats-popup" />
      
            <div className="container w-full max-w-[1200px] pb-48">
                {/* Breadcrumbs de navegación */}
                <Breadcrumbs />

                <PremiumHeader onBack={showForm ? () => {setShowForm(false);} : undefined}
        title="Generador de ATS"
        subtitle="Identificación y control de riesgos para tareas críticas"
        icon={<ShieldCheck size={36} />} />
        

                {!showForm ?
        <>
                        
                        {/* KPIs */}
                        <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-[1rem] mb-[2rem]">
                            <div className="bg-[var(--color-surface)] p-[1.5rem] rounded-[16px] border-[1px_solid_var(--color-border)] box-shadow-[var(--shadow-sm)] flex items-center gap-[1rem]">
                                <div className="bg-blue-100 text-blue-600 p-[1rem] rounded-[12px]"><ShieldCheck size={28} /></div>
                                <div>
                                    <div className="text-[0.8rem] font-[800] text-[var(--color-text-muted)] uppercase">ATS Generados</div>
                                    <div className="text-[1.8rem] font-[900] text-[var(--color-text)]">{history.length}</div>
                                </div>
                            </div>
                            <div className="bg-[var(--color-surface)] p-[1.5rem] rounded-[16px] border-[1px_solid_var(--color-border)] box-shadow-[var(--shadow-sm)] flex items-center gap-[1rem]">
                                <div className="bg-amber-100 text-amber-600 p-[1rem] rounded-[12px]"><ShieldAlert size={28} /></div>
                                <div>
                                    <div className="text-[0.8rem] font-[800] text-[var(--color-text-muted)] uppercase">Riesgo Alto (Total)</div>
                                    <div className="text-[1.8rem] font-[900] text-[var(--color-text)]">{history.filter(h => h.tareas?.some(t => t.nivelRiesgo === 'Alto')).length}</div>
                                </div>
                            </div>
                            <div className="bg-[var(--color-surface)] p-[1.5rem] rounded-[16px] border-[1px_solid_var(--color-border)] box-shadow-[var(--shadow-sm)] flex items-center gap-[1rem]">
                                <div className="bg-green-100 text-green-600 p-[1rem] rounded-[12px]"><CheckCircle2 size={28} /></div>
                                <div>
                                    <div className="text-[0.8rem] font-[800] text-[var(--color-text-muted)] uppercase">ATS Última Semana</div>
                                    <div className="text-[1.8rem] font-[900] text-[var(--color-text)]">{history.filter(h => new Date(h.fecha) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-[1.5rem] flex gap-[1rem] flex-wrap items-stretch bg-[var(--color-surface,_#fff)] p-[1.5rem] rounded-[24px] box-shadow-[0_10px_40px_rgba(0,0,0,0.04)] border-[1px_solid_rgba(0,0,0,0.05)]">
                            <div className="flex-[1_1_250px] relative">
                                <Search size={22} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                type="text"
                placeholder="Buscar por empresa, obra o responsable..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={(e) => {e.currentTarget.style.border = '2px solid #3b82f6';e.currentTarget.style.backgroundColor = 'transparent';e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.1)';}}
                onBlur={(e) => {e.currentTarget.style.border = '2px solid transparent';e.currentTarget.style.backgroundColor = 'transparent';e.currentTarget.style.boxShadow = 'none';}}
                style={{ width: '100%', height: '100%', minHeight: '3.5rem', padding: '0.75rem 1rem 0.75rem 3.5rem', borderRadius: '1rem', border: '2px solid transparent', backgroundColor: 'rgba(241, 245, 249, 0.5)', fontSize: '1rem', outline: 'none', transition: 'all 0.3s', fontWeight: 500, color: 'var(--color-text)' }} />
                            </div>
                            
                            <div className="flex gap-[0.5rem]">
                                <button
                  onClick={() => {
                    setFormData({
                      id: '', empresa: '', cuit: '', obra: '', tarea: '', fecha: new Date().toISOString().split('T')[0], capatazNombre: '', operatorSignature: '', capatazSignature: '', checklist: defaultChecklist, tareas: [{ id: 1, paso: 'Preparación de área', riesgo: 'Caídas', control: 'Delimitación', nivelRiesgo: 'Medio', realizado: true }, { id: 2, paso: 'Ejecución de tarea', riesgo: 'Golpes', control: 'Uso de EPP', nivelRiesgo: 'Bajo', realizado: false }], epps: [], fotos: []
                    });
                    navigate('/ats/nuevo');
                  }}
                  onMouseOver={(e) => {e.currentTarget.style.transform = 'translateY(-2px)';e.currentTarget.style.boxShadow = '0 12px 25px rgba(16,185,129,0.4)';}}
                  onMouseOut={(e) => {e.currentTarget.style.transform = 'none';e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,185,129,0.3)';}}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0 1.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', fontWeight: 800, borderRadius: '1rem', border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(16,185,129,0.3)', whiteSpace: 'nowrap', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', height: '100%', minHeight: '3.5rem' }}>
                                    <Plus size={22} strokeWidth={2.5} /> Nuevo ATS
                                </button>
                                
                                {history.length > 0 &&
                                    <button
                                        onClick={handleExportCSV}
                                        onMouseOver={(e) => {e.currentTarget.style.transform = 'translateY(-2px)';e.currentTarget.style.boxShadow = '0 12px 25px rgba(59,130,246,0.4)';}}
                                        onMouseOut={(e) => {e.currentTarget.style.transform = 'none';e.currentTarget.style.boxShadow = '0 8px 20px rgba(59,130,246,0.3)';}}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0 1.5rem', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#ffffff', fontWeight: 800, borderRadius: '1rem', border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(59,130,246,0.3)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', height: '100%', minHeight: '3.5rem' }}>
                                        <Download size={20} strokeWidth={2.5} /> Excel
                                    </button>
                                }
                            </div>
                        </div>

                        <DataTable
            data={filteredHistory}
            columns={columns}
            searchPlaceholder="Buscar..."
            hideHeader={true}
            emptyMessage="No se encontraron registros de ATS."
            emptyIcon={<ClipboardList size={48} />} />
          

                        {qrTarget && <QRModal text={(qrTarget as any).text} title={(qrTarget as any).title} onClose={() => setQrTarget(null)} />}
                        
                        <ConfirmModal
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal({ isOpen: false, type: '', payload: null })}
            onConfirm={executeConfirmAction}
            title={
            confirmModal.type === 'delete' ? '¿Eliminar ATS?' :
            confirmModal.type === 'template' ? '¿Reemplazar tareas?' :
            '¿Reiniciar formulario?'
            }
            message={
            confirmModal.type === 'delete' ? 'Esta acción no se puede deshacer.' :
            confirmModal.type === 'template' ? 'Se borrarán las tareas actuales para cargar la plantilla seleccionada.' :
            'Se perderán todos los datos y tareas que no hayas guardado.'
            }
            type={confirmModal.type === 'delete' ? 'danger' : 'warning'}
            iconEmoji={
            confirmModal.type === 'delete' ? '🗑️' :
            confirmModal.type === 'template' ? '🔄' :
            '⚠️'
            } />
          

                        <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`ATS - ${(shareItem as any)?.obra || ''}`} rawMessage={shareItem ? `📋 ATS\n🏗️ Empresa: ${(shareItem as any).empresa}\n🚧 Obra: ${(shareItem as any).obra}\n📅 Fecha: ${(shareItem as any).fecha}` : ''} text={shareItem ? `📋 ATS\n🏗️ Empresa: ${(shareItem as any).empresa}\n🚧 Obra: ${(shareItem as any).obra}\n📅 Fecha: ${(shareItem as any).fecha}` : ''} elementIdToPrint="pdf-content" fileName={`ATS_${(shareItem as any)?.empresa?.replace(/\s+/g, '_') || 'Reporte'}.pdf`} />
                        <div className="ats-pdf-offscreen">
                            <ATSPdfGenerator atsData={shareItem} />
                        </div>
                    </> :

        <>


                <ShareModal
            isOpen={showShare}
            open={showShare}
            onClose={() => setShowShare(false)}
            title={`ATS – ${formData.empresa} (${formData.obra})`}
            text={`🔐 Análisis de Trabajo Seguro\n🏗️ Empresa: ${formData.empresa}\n🚧 Obra: ${formData.obra}\n📅 Fecha: ${formData.fecha}\n📋 Tarea: ${formData.tarea}\n\nGenerado con Asistente HYS`}
            elementIdToPrint="pdf-content"
            rawMessage={``}
            fileName={`ATS_${formData.empresa || 'Reporte'}.pdf`} />
          

                <div className="ats-pdf-offscreen" aria-hidden="true">
                    <ATSPdfGenerator
              atsData={{
                ...formData,
                showSignatures,
                professionalName: professional.name,
                professionalLicense: professional.license,
                professionalSignature: professional.signature
              }} />
            
                </div>




                <ModuleFormLayout>
                <ModuleFormToolbar
                  title={editData ? 'Editar ATS' : 'Análisis de Trabajo Seguro'}
                  subtitle="Control HYS"
                  icon={<ShieldCheck className="text-blue-600" size={28} />}
                  progress={{ percent: progressPct, label: progressLabel, color: progressColor }}
                  steps={ATS_WIZARD_STEPS}
                  currentStep={currentStep}
                />

                <ModuleFormDocument id="ats-editor-content" className="ats-editor-panel">

                    <div className="flex flex-row justify-space-between items-center border-bottom-[4px_solid_var(--color-border)] pb-[1.5rem] mb-[2rem] w-[100%] gap-[1.5rem]">
                        {/* Top Left Text */}
                        <div className="flex-[1] text-left">
                            <p className="m-[0] font-[700] text-[0.65rem] uppercase text-[var(--color-text-muted)] letter-spacing-[0.05em]">Sistema de Gestión</p>
                            <p className="m-[0] font-[900] text-[0.75rem] uppercase text-[var(--color-text)]">Control HYS</p>
                        </div>

                        {/* Center Main Title */}
                        <div className="flex-[1] flex flex-col items-center justify-center text-center">
                            <h1 className="m-[0] font-[900] text-[2.5rem] letter-spacing-[-0.02em] uppercase line-height-[1]">A.T.S.</h1>
                            <p className="m-[0] text-[var(--color-text-muted)] font-[900] text-[0.6rem] uppercase letter-spacing-[0.4em] mt-[0.25rem]">Análisis de Trabajo Seguro</p>
                        </div>

                        {/* Right Document Counter + Logo */}
                        <div className="flex-[1] text-right flex flex-col items-end gap-[0.5rem]">
                            <CompanyLogo className="h-[40px] max-w-[120px]" />
                            <div>
                                <div className="text-[0.6rem] font-[900] text-[var(--color-border)] uppercase letter-spacing-[0.1em] mb-[0.25rem]">PÁGINA</div>
                                <div className="font-[900] text-[1.5rem] text-[var(--color-text)]">01 / 01</div>
                            </div>
                        </div>
                    </div>

                    {/* STEP 1 */}
                    {currentStep === 1 && (
                        <div className="wizard-step-anim">
                            <ModuleFormSection title="Datos del Proyecto" icon={<Building2 size={20} />}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="flex flex-col gap-2 lg:col-span-2">
                                        <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
                                            <Building2 size={14} /> CLIENTE / EMPRESA
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.empresa}
                                            onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                                            className="module-form-input text-lg font-bold"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
                                            <ShieldCheck size={14} /> CUIT / CUIL
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.cuit}
                                            onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                                            className="module-form-input"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
                                            <MapPin size={14} /> UBICACIÓN / OBRA
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.obra}
                                            onChange={(e) => setFormData({ ...formData, obra: e.target.value })}
                                            className="module-form-input"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
                                            <Calendar size={14} /> FECHA
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.fecha}
                                            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                            className="module-form-input"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 lg:col-span-3">
                                        <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
                                            <FileText size={14} /> DESCRIPCIÓN DE LA TAREA
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.tarea}
                                            onChange={(e) => setFormData({ ...formData, tarea: e.target.value })}
                                            className="module-form-input"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 lg:col-span-2">
                                        <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
                                            <User size={14} /> RESPONSABLE
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.capatazNombre}
                                            onChange={(e) => setFormData({ ...formData, capatazNombre: e.target.value })}
                                            className="module-form-input"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
                                            <ShieldCheck size={14} /> PROFESIONAL HYS
                                        </label>
                                        <input
                                            type="text"
                                            value={professional.name}
                                            readOnly
                                            className="module-form-input bg-slate-50 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </ModuleFormSection>
                        </div>
                    )}

                    {/* STEP 2: Sección de Secuencia de Tareas */}
                    {currentStep === 2 &&
            <div className="wizard-step-anim mt-[3rem] mb-[3rem]">
                        <div className="no-print mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-[1.25rem]">
                                <h3 className="m-[0] flex items-center gap-[0.8rem] text-[var(--color-primary)] font-[900] text-[1.2rem] uppercase letter-spacing-[1px]">
                                    <Pencil size={22} className="text-blue-600" /> Secuencia de Tareas
                                </h3>
                                <div className="flex gap-[0.6rem] flex-wrap">
                                    <button
                      onClick={handleGenerateAI}
                      disabled={isGeneratingATS || isVisionATS}
                      style={{
                        cursor: (isGeneratingATS || isVisionATS) ? 'wait' : 'pointer',
                        opacity: (isGeneratingATS || isVisionATS) ? 0.7 : 1
                      }}
                      className="hover:scale-[1.03] active:scale-[0.97] hover:shadow-[0_6px_22px_rgba(139,92,246,0.5)] flex-[1] min-width-[120px] p-[0.7rem_1.4rem] bg-[linear-gradient(135deg,_#8b5cf6,_#ec4899)] text-[#ffffff] border-none rounded-[14px] font-[900] text-[0.8rem] flex items-center justify-center gap-[0.5rem] box-shadow-[0_4px_18px_rgba(139,92,246,0.35)] transition-[all_0.3s_cubic-bezier(0.34,_1.56,_0.64,_1)]">
                      
                                        {isGeneratingATS ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                        {isGeneratingATS ? 'PENSANDO...' : 'IA MÁGICA'}
                                    </button>

                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      capture="environment" 
                                      ref={fileInputRef} 
                                      onChange={handleVisionUpload} 
                                      style={{ display: 'none' }} 
                                    />
                                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isGeneratingATS || isVisionATS}
                      style={{
                        cursor: (isGeneratingATS || isVisionATS) ? 'wait' : 'pointer',
                        opacity: (isGeneratingATS || isVisionATS) ? 0.7 : 1
                      }}
                      className="hover:scale-[1.03] active:scale-[0.97] hover:shadow-[0_6px_22px_rgba(59,130,246,0.5)] flex-[1] min-width-[120px] p-[0.7rem_1.4rem] bg-[linear-gradient(135deg,_#3b82f6,_#2563eb)] text-[#ffffff] border-none rounded-[14px] font-[900] text-[0.8rem] flex items-center justify-center gap-[0.5rem] box-shadow-[0_4px_18px_rgba(59,130,246,0.35)] transition-[all_0.3s_cubic-bezier(0.34,_1.56,_0.64,_1)]">
                      
                                        {isVisionATS ? <Loader2 size={16} className="animate-spin" /> : <CameraIcon size={16} />}
                                        {isVisionATS ? 'ANALIZANDO...' : 'AUTOCOMPLETAR FOTO'}
                                    </button>

                                    <button
                      onClick={addTask}
                      className="hover:scale-[1.03] active:scale-[0.97] hover:shadow-[0_6px_18px_rgba(16,185,129,0.35)] flex-[1] min-width-[120px] p-[0.7rem_1.4rem] border-none rounded-[14px] font-[900] text-[0.8rem] cursor-pointer flex items-center justify-center gap-[0.5rem] box-shadow-[0_4px_14px_rgba(16,185,129,0.25)] transition-[all_0.3s_cubic-bezier(0.34,_1.56,_0.64,_1)]"
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}>
                      
                                        <Plus size={16} /> AGREGAR PASO
                                    </button>
                                </div>
                            </div>

                            {/* Presets List */}
                            <div className="flex gap-[0.6rem] flex-wrap bg-[var(--glass-bg)] backdrop-filter-[blur(12px)] p-[1.25rem] rounded-[18px] border-[1px_solid_var(--glass-border-subtle)] box-shadow-[var(--shadow-sm)]">
                  
                                <span className="text-[0.75rem] font-[900] text-[var(--color-primary)] uppercase letter-spacing-[1px] w-[100%] mb-[0.5rem] flex items-center gap-[0.4rem]">
                    
                                    <Sparkles size={14} className="text-purple-500" /> Plantillas Rápidas para Tareas Críticas:
                                </span>
                                {Object.keys(PRESETS).map((name) => (
                                    <button
                                        key={name}
                                        onClick={() => handleApplyPreset(name)}
                                        className="hover:-translate-y-0.5 hover:shadow-sm p-[0.5rem_1rem] rounded-[12px] text-[0.75rem] font-[800] cursor-pointer flex items-center gap-[0.5rem] transition-all"
                                        style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc' }}
                                    >
                                        <Plus size={14} className="text-blue-500" /> {name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <h3 className="print-only m-[0_0_1.5rem_0] flex items-center gap-[0.8rem] text-[var(--color-primary)] font-[900] text-[1.1rem] uppercase letter-spacing-[1px]">
                            <Pencil size={22} /> Secuencia de Tareas (Análisis)
                        </h3>

                        <div className="ats-sequence-container">
                            <div className="ats-seq-header no-print">
                                <div className="ats-seq-head-num">#</div>
                                <div>1. Paso a seguir</div>
                                <div>2. Riesgos asociados</div>
                                <div>3. Medidas de control</div>
                                <div>4. Nivel Riesgo</div>
                                <div className="ats-seq-head-action" aria-hidden="true" />
                            </div>

                            <div className="ats-seq-body">
                                {formData.tareas.map((t, index) =>
                  <div key={t.id} className="ats-seq-row ats-table-row">
                                        <div className="ats-seq-cell ats-seq-cell-num">
                                            <span className="ats-seq-num-desktop">{index + 1}</span>
                                            <span className="ats-seq-num-mobile">PASO {index + 1}</span>
                                        </div>

                                        <div className="ats-seq-cell ats-seq-cell-paso">
                                            <span className="ats-seq-mobile-label">Paso a seguir</span>
                                            <textarea
                        rows={1}
                        value={t.paso}
                        onChange={(e) => updateTask(t.id, 'paso', e.target.value)}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                        className="no-print ats-textarea ats-seq-textarea"
                        placeholder="Ej: Preparación de área..." />
                      
                                            <div className="print-only font-bold text-slate-800 text-[0.85rem] whitespace-pre-wrap break-words">
                                                {t.paso}
                                            </div>
                                        </div>

                                        <div className="ats-seq-cell ats-seq-cell-riesgo">
                                            <span className="ats-seq-mobile-label">Riesgos asociados</span>
                                            <textarea
                        rows={1}
                        value={t.riesgo}
                        onChange={(e) => updateTask(t.id, 'riesgo', e.target.value)}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                        className="no-print ats-textarea ats-seq-textarea"
                        placeholder="Ej: Caídas, Golpes..." />
                      
                                            <div className="print-only text-slate-700 text-[0.8rem] whitespace-pre-wrap break-words">
                                                {t.riesgo}
                                            </div>
                                        </div>

                                        <div className="ats-seq-cell ats-seq-cell-control">
                                            <span className="ats-seq-mobile-label">Medidas de control</span>
                                            <textarea
                        rows={1}
                        value={t.control}
                        onChange={(e) => updateTask(t.id, 'control', e.target.value)}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                        className="no-print ats-textarea ats-seq-textarea"
                        placeholder="Ej: Delimitación, Uso EPP..." />
                      
                                            <div className="print-only text-slate-700 text-[0.8rem] whitespace-pre-wrap break-words">
                                                {t.control}
                                            </div>
                                        </div>

                                        <div className="ats-seq-cell ats-seq-cell-riesgo-nivel" style={{flex: 0.5}}>
                                            <span className="ats-seq-mobile-label">Nivel de Riesgo</span>
                                            <select
                                                value={t.nivelRiesgo || 'Bajo'}
                                                onChange={(e) => updateTask(t.id, 'nivelRiesgo', e.target.value)}
                                                className="no-print ats-input mt-[0.5rem] p-[0.4rem] rounded-[8px] font-[800] text-[0.8rem] w-full"
                                                style={{
                                                    backgroundColor: t.nivelRiesgo === 'Alto' ? '#fee2e2' : t.nivelRiesgo === 'Medio' ? '#fef3c7' : '#dcfce7',
                                                    color: t.nivelRiesgo === 'Alto' ? '#dc2626' : t.nivelRiesgo === 'Medio' ? '#d97706' : '#16a34a',
                                                    border: 'none',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="Bajo">Bajo</option>
                                                <option value="Medio">Medio</option>
                                                <option value="Alto">Alto</option>
                                            </select>
                                            <div className="print-only text-[0.8rem] font-[800]" style={{ color: t.nivelRiesgo === 'Alto' ? '#dc2626' : t.nivelRiesgo === 'Medio' ? '#d97706' : '#16a34a' }}>
                                                {t.nivelRiesgo || 'Bajo'}
                                            </div>
                                        </div>

                                        <div className="ats-seq-cell ats-seq-cell-action no-print">
                                            <button
                                                type="button"
                                                onClick={() => removeTask(t.id)}
                                                className="ats-seq-delete-btn"
                                                title="Eliminar paso">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                  )}
                            </div>
                        </div>
                        </div>
            }

                    {/* STEP 3 */}
                    {/* STEP 3: EPPs y Evidencia Fotográfica */}
                    {currentStep === 3 && (
                        <div className="wizard-step-anim mt-[3rem]">
                            <ModuleFormSection title="EPPs Obligatorios y Evidencia" icon={<HardHat size={20} />}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-[2rem]">
                            {/* EPPs Selector */}
                            <div className="bg-[var(--color-surface)] p-[1.5rem] rounded-[16px] border-[1px_solid_var(--color-border)] box-shadow-[var(--shadow-sm)]">
                                <h4 className="m-[0_0_1rem_0] text-[0.9rem] font-[800] uppercase text-[var(--color-text)]">Selección de EPPs</h4>
                                <div className="flex flex-wrap gap-[0.8rem]">
                                    {[
                                        { id: 'casco', label: 'Casco', icon: HardHat },
                                        { id: 'guantes', label: 'Guantes', icon: ShieldCheck },
                                        { id: 'anteojos', label: 'Anteojos', icon: EyeIcon },
                                        { id: 'auditiva', label: 'Prot. Auditiva', icon: Ear },
                                        { id: 'arnes', label: 'Arnés', icon: Activity },
                                        { id: 'calzado', label: 'Calzado Seg.', icon: ShieldCheck }
                                    ].map(epp => {
                                        const isSelected = formData.epps?.includes(epp.id);
                                        const Icon = epp.icon;
                                        return (
                                            <button
                                                key={epp.id}
                                                onClick={() => {
                                                    const current = formData.epps || [];
                                                    const updated = isSelected ? current.filter(e => e !== epp.id) : [...current, epp.id];
                                                    setFormData({ ...formData, epps: updated });
                                                }}
                                                className={`flex items-center gap-[0.5rem] p-[0.6rem_1rem] rounded-[12px] transition-[all_0.2s] cursor-pointer`}
                                                style={isSelected ? { background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', boxShadow: '0 4px 10px rgba(59,130,246,0.3)' } : { backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}
                                            >
                                                <Icon size={18} />
                                                <span className="font-[800] text-[0.8rem]">{epp.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Photo Upload */}
                            <div className="bg-[var(--color-surface)] p-[1.5rem] rounded-[16px] border-[1px_solid_var(--color-border)] box-shadow-[var(--shadow-sm)]">
                                <h4 className="m-[0_0_1rem_0] text-[0.9rem] font-[800] uppercase text-[var(--color-text)]">Evidencia Fotográfica</h4>
                                <p className="text-[0.8rem] text-[var(--color-text-muted)] mb-[1rem]">Adjunte hasta 2 fotografías del área de trabajo o equipos involucrados.</p>
                                
                                <div className="flex gap-[1rem]">
                                    {[0, 1].map(index => {
                                        const photoUrl = formData.fotos?.[index];
                                        return (
                                            <div key={index} className="flex-[1] aspect-square rounded-[12px] border-[2px_dashed_var(--color-border)] flex items-center justify-center relative overflow-hidden bg-[var(--color-background)] hover:border-blue-400 transition-colors">
                                                {photoUrl ? (
                                                    <>
                                                        <img src={photoUrl} alt={`Evidencia ${index + 1}`} className="w-full h-full object-cover" />
                                                        <button
                                                            onClick={() => {
                                                                const newFotos = [...(formData.fotos || [])];
                                                                newFotos.splice(index, 1);
                                                                setFormData({ ...formData, fotos: newFotos });
                                                            }}
                                                            className="absolute top-[0.5rem] right-[0.5rem] bg-red-500 text-white p-[0.4rem] rounded-full shadow-md hover:bg-red-600"
                                                        >
                                                            <TrashIcon size={14} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-[var(--color-text-muted)]">
                                                        <CameraIcon size={24} className="mb-[0.5rem]" />
                                                        <span className="text-[0.7rem] font-[700] uppercase text-center">Subir /<br/>Tomar Foto</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onloadend = () => {
                                                                        const newFotos = [...(formData.fotos || [])];
                                                                        newFotos[index] = reader.result as string;
                                                                        setFormData({ ...formData, fotos: newFotos });
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                                </div>
                            </ModuleFormSection>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="wizard-step-anim mt-[3rem]">
                            <ModuleFormSection title="Verificación de Seguridad" icon={<ShieldCheck size={20} />}>
                                {categories.map((cat) =>
              <div key={cat} className="ats-checklist-card">
                                <div className="flex justify-space-between items-center mb-[1.2rem] border-bottom-[1px_solid_var(--color-border)] pb-[0.8rem]">
                                    <h4 className="m-[0] text-[var(--color-primary)] font-[900] text-[0.85rem] uppercase letter-spacing-[1px] flex items-center gap-[0.6rem]">
                                        <div className="no-print p-[0.4rem] bg-[rgba(var(--color-primary-rgb),_0.1)] rounded-[8px] text-[var(--color-primary)] flex items-center">
                                            <Info size={16} />
                                        </div>

                                        <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateCategoryName(cat, e.target.innerText)}

                      className="hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-0.5 rounded cursor-edit outline-[none]">
                      
                                            {cat}
                                        </span>
                                    </h4>
                                    <button
                    className="no-print p-[0.5rem_1rem] text-[#ffffff] border-none rounded-[10px] font-[800] text-[0.7rem] cursor-pointer box-shadow-[0_4px_10px_rgba(16,185,129,_0.2)] transition-[all_0.2s]"
                    onClick={() => addQuestion(cat)}
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
                    
                                        + AGREGAR
                                    </button>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {formData.checklist.filter((i) => i.categoria === cat).map((item) =>
                  <div key={item.id} className="group p-4 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:shadow-sm">
                                            {/* Question text */}
                                            <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateChecklist(item.id, 'pregunta', e.target.innerText)}
                      className="font-bold text-[var(--color-text)] text-[0.95rem] outline-none border-b border-dashed border-transparent focus:border-[var(--color-primary)] leading-tight mb-2 cursor-edit hover:bg-slate-100 dark:hover:bg-slate-800 px-1 py-0.5 rounded">
                      
                                                {item.pregunta}
                                            </div>

                                            {/* Observaciones */}
                                            <textarea
                      rows={1}
                      placeholder="Observaciones o medidas preventivas..."
                      value={item.observaciones}
                      className="no-print ats-textarea mt-[0.5rem]"
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      onChange={(e) => updateChecklist(item.id, 'observaciones', e.target.value)} />

                    
                                            <div className="print-only text-[0.7rem] text-slate-500 whitespace-pre-wrap break-words mb-1">
                                                {item.observaciones || ''}
                                            </div>

                                            {/* Bottom row: status buttons + delete */}
                                            <div className="no-print flex items-center justify-space-between gap-[0.5rem] mt-[0.8rem]">
                                                <div className="ats-status-group">
                                                    <button onClick={() => updateChecklist(item.id, 'estado', 'Cumple')} className={`flex-1 p-2 rounded-lg font-bold text-xs ${item.estado === 'Cumple' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>SI</button>
                                                    <button onClick={() => updateChecklist(item.id, 'estado', 'No Cumple')} className={`flex-1 p-2 rounded-lg font-bold text-xs ${item.estado === 'No Cumple' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'}`}>NO</button>
                                                    <button onClick={() => updateChecklist(item.id, 'estado', 'N/A')} className={`flex-1 p-2 rounded-lg font-bold text-xs ${item.estado === 'N/A' ? 'bg-slate-500 text-white' : 'bg-slate-100 text-slate-500'}`}>N/A</button>
                                                </div>
                                                <button
                        onClick={() => removeQuestion(item.id)}
                        title="Eliminar" 
                        style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}
                        className="border-[1px_solid_rgba(239,68,68,0.1)] rounded-[8px] cursor-pointer p-[0.4rem] flex items-center transition-colors hover:bg-red-200">
                        
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            {/* Vista de Impresión Reforzada */}
                                            <div className="checklist-print-box hidden print:flex gap-1 flex-shrink-[0]">
                                                {['SI', 'NO', 'NA'].map((label) => {
                        const isSelected = label === 'SI' && (item.estado === 'Cumple' || item.estado === 'SI') ||
                        label === 'NO' && (item.estado === 'No Cumple' || item.estado === 'NO') ||
                        label === 'NA' && (item.estado === 'N/A' || item.estado === 'NA');

                        return (
                          <div key={label} style={{


                            border: isSelected ? '2.5px solid #000' : '1px solid #94a3b8',





                            fontWeight: isSelected ? 900 : 400,
                            color: isSelected ? '#000' : '#94a3b8'

                          }} className="w-[35px] h-[24px] rounded-[4px] flex items-center justify-center text-[0.65rem] bg-[transparent]">
                                                            {isSelected ? 'X' : ''}
                                                            <span style={{ opacity: isSelected ? 1 : 0.6 }} className="text-[0.5rem] ml-[2px]">{label}</span>
                                                        </div>);

                      })}
                                            </div>
                                        </div>
                  )}
                                </div>
                            </div>
              )}
                            </ModuleFormSection>
                        </div>
            )}

                    {/* STEP 5 */}
                    {currentStep === 5 && (
                        <div className="wizard-step-anim mt-[2.5rem]">
                            <ModuleFormSection title="Firmas y Autorizaciones" icon={<Pencil size={20} />}>

                        {/* Custom visual switches */}
                        <div className="no-print mb-8 p-6 bg-[rgba(30,_41,_59,_0.2)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] w-[100%] flex flex-col gap-[1.25rem] justify-center items-center">
                            <div className="text-[var(--color-text)] font-[800] text-[0.85rem] uppercase letter-spacing-[0.5px]">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                            <div className="flex gap-[1rem] flex-wrap justify-center">
                                {[
                  { id: 'operator', label: 'Operador / Capataz' },
                  { id: 'supervisor', label: 'Supervisor' },
                  { id: 'professional', label: 'Profesional' }].
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
                        <PdfSignatures
                data={{
                  ...formData,
                  professionalSignature: professional.signature,
                  professionalName: professional.name,
                  professionalLicense: professional.license
                }}
                box1={showSignatures.operator ? {
                  title: 'OPERADOR / CAPATAZ',
                  subtitle: (formData.capatazNombre || 'Firma / Aclaración').toUpperCase(),
                  signatureUrl: formData.operatorSignature || null,
                  isProfessional: false
                } : null}
                box2={showSignatures.supervisor ? {
                  title: 'SUPERVISOR / JEFE OBRA',
                  subtitle: 'FIRMA DEL SUPERVISOR',
                  signatureUrl: formData.capatazSignature || null,
                  isProfessional: false
                } : null}
                box3={showSignatures.professional ? {
                  title: 'PROFESIONAL ACTUANTE',
                  subtitle: (professional.name || 'Firma y Sello').toUpperCase(),
                  signatureUrl: professional.signature || null,
                  isProfessional: true,
                  license: professional.license
                } : null} />
              

                        {/* Interactive Signature Drawing Pads */}
                        <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 gap-8">
                            {showSignatures.operator &&
                <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas
                    onSave={(sig) => setFormData((prev) => ({ ...prev, operatorSignature: sig || '' }))}
                    initialImage={formData.operatorSignature}
                    label="Firma del Operador / Responsable" />
                  
                                </div>
                }
                            
                            {showSignatures.supervisor &&
                                <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas
                                        onSave={(sig) => setFormData((prev) => ({ ...prev, capatazSignature: sig || '' }))}
                                        initialImage={formData.capatazSignature}
                                        label="Firma del Supervisor" />
                                </div>
                            }
                        </div>
                            </ModuleFormSection>
                        </div>
                    )}

                    <ModuleWizardFooter
                      currentStep={currentStep}
                      totalSteps={totalSteps}
                      onPrev={prevStep}
                      onNext={nextStep}
                      finalActions={[
                        { id: 'clear', label: 'Limpiar', icon: <Trash2 size={18} />, variant: 'danger', onClick: handleClearForm },
                        { id: 'print', label: 'Imprimir', icon: <Printer size={18} />, variant: 'warning', onClick: handlePrint },
                        { id: 'share', label: 'Compartir', icon: <Share2 size={18} />, variant: 'info', onClick: handleShare },
                        {
                          id: 'save',
                          label: 'Guardar ATS',
                          icon: <Save size={18} />,
                          variant: 'primary',
                          onClick: (e) => { e.preventDefault(); requirePro(handleSave); },
                        },
                      ]}
                    />

                    <PdfBrandingFooter />
                </ModuleFormDocument>
                </ModuleFormLayout>
                </>
        }
            </div>
            {/* ─── Modal IA Mágica ─── */}
            {
      showAIModal &&
      <div
        onClick={() => setShowAIModal(false)}
        className="modal-overlay-glass fixed inset-[0] z-[9000] flex items-center justify-center p-[1.5rem]">

        
                        <div
          onClick={(e) => e.stopPropagation()}
          className="modal-glass w-[100%] max-w-[460px] p-[2.5rem] border-[1px_solid_rgba(168,85,247,0.3)] box-shadow-[0_25px_60px_rgba(168,85,247,0.2)]">

          
                            <div className="flex items-center gap-[1rem] mb-[1.5rem]">
                                <div className="ai-glow bg-[linear-gradient(135deg,#a855f7,#ec4899)] rounded-[14px] p-[0.8rem] flex items-center justify-center box-shadow-[0_8px_20px_rgba(168,85,247,0.4)]">
                                    <Sparkles size={24} color="white" />
                                </div>
                                <div>
                                    <h2 className="m-[0] text-[1.5rem] font-[900] bg-[linear-gradient(135deg,#a855f7,#ec4899)] webkit-background-clip-[text] webkit-text-fill-color-[transparent]">IA Mágica</h2>
                                    <p className="m-[0] text-[0.8rem] text-[var(--color-text-muted)] font-[600]">Generador Inteligente de ATS</p>
                                </div>
                            </div>
                            
                            <p className="text-[var(--color-text-muted)] text-[0.9rem] mb-[2rem] line-height-[1.6]">
                                Describí la tarea que vas a realizar. La IA analizará los riesgos potenciales y propondrá las mejores medidas de control.
                            </p>

                            <div className="mb-8">
                                <label className="text-[0.8rem] font-[800] text-[var(--color-text)] mb-[0.6rem] block uppercase letter-spacing-[1px]">
                                    Tarea a Analizar
                                </label>
                                <input
              autoFocus
              type="text"
              value={aiTaskInput}
              onChange={(e) => setAiTaskInput(e.target.value)}
              onKeyDown={(e) => {if (e.key === 'Enter' && aiTaskInput.trim()) runAIGeneration();}}
              placeholder="Ej: Pintura en altura con balancín..."

              className="focus:border-purple-500 focus:shadow-[0_0_0_4px_rgba(168,85,247,0.1)] w-[100%] p-[1rem_1.2rem] rounded-[14px] border-[2px_solid_var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] text-[1rem] font-[600] outline-[none] box-sizing-[border-box] transition-[all_0.3s_ease]" />
            
                            </div>

                            <div className="flex gap-[1rem]">
                                <button
              onClick={() => setShowAIModal(false)}

              className="hover:bg-slate-50 flex-[1] p-[1rem] rounded-[14px] border-[1.5px_solid_var(--color-border)] bg-[transparent] text-[var(--color-text-muted)] font-[700] cursor-pointer text-[0.9rem] transition-[all_0.2s]">
              
                                    Cancelar
                                </button>
                                <button
              onClick={runAIGeneration}
              disabled={!aiTaskInput.trim()}
              style={{ background: aiTaskInput.trim() ? 'linear-gradient(135deg,#a855f7,#ec4899)' : 'var(--color-border)', cursor: aiTaskInput.trim() ? 'pointer' : 'not-allowed', boxShadow: aiTaskInput.trim() ? '0 10px 25px rgba(168,85,247,0.3)' : 'none' }}
              className={`flex-[2] p-[1rem] rounded-[14px] border-none text-[#ffffff] font-[800] text-[0.95rem] flex items-center justify-center gap-[0.6rem] transition-[all_0.3s_cubic-bezier(0.34,_1.56,_0.64,_1)] ${aiTaskInput.trim() ? "hover:scale-[1.03] active:scale-[0.97]" : ""}`}>
              
                                    <Sparkles size={18} /> GENERAR AHORA
                                </button>
                            </div>
                        </div>
                    </div>
      }
        </>);


}