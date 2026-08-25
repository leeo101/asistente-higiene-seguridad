import React, { useState, useEffect, useMemo } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Download, Search, AlertTriangle, FileText, ChevronRight, X, User, Briefcase, Activity, Calendar, FileQuestion, Users, FileSignature, CheckCircle2, Shield, Save, Building2, TreeDeciduous, ShieldAlert, Zap, Box, Wind, Droplets, ArrowUpCircle, Truck, Pencil, Share2, Trash2, QrCode, Camera, MapPin, Sparkles, UserPlus, ListPlus, ChevronLeft, Printer, Mic, MicOff, XCircle } from 'lucide-react';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
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
import RootCauseAnalyzer from '../components/RootCauseAnalyzer';

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

const ACCIDENT_PRESETS = [
  {
    id: 'corte',
    label: '🔨 Corte por Amoladora / Herramienta',
    empresa: 'Planta Industrial SRL',
    ubicacion: 'Taller de Mecanizado',
    gravedad: 'Moderado',
    victimaNombre: 'Carlos Gómez',
    victimaDni: '34567890',
    victimaPuesto: 'Oficial Metalúrgico',
    victimaAntiguedad: '3 años',
    lesion: 'Herida cortante incisa en palma de mano',
    parteCuerpo: 'Mano Derecha / Dedos',
    mecanismoAccidente: 'Contacto con objeto cortante en movimiento',
    parteCuerpoEspecifica: 'Mano / Dedos',
    artNombre: 'Provincia ART',
    numeroSiniestro: 'SIN-884920',
    centroMedico: 'Sanatorio Central',
    diasIltEstimados: '14',
    descripcionHecho: 'Al manipular la amoladora angular sin la guarda fijada correctamente, se produjo el trabamiento del disco provocando un contragolpe (kickback) que hizo contacto con la mano del trabajador.',
    problemaCentral: 'Contragolpe de amoladora provocando corte en mano derecha',
    porques: [
      'Traba del disco en la pieza metálica.',
      'Inexistencia de guarda de protección instalada en la herramienta.',
      'Retiro intencional de la guarda para mayor velocidad de corte.',
      'Falta de supervisión efectiva en el taller y falta de procedimiento de trabajo seguro.'
    ]
  },
  {
    id: 'lumbago',
    label: '📦 Lumbalgia por Carga Física (Res. 886/15)',
    empresa: 'Logística & Depósito SA',
    ubicacion: 'Sector Expedición',
    gravedad: 'Moderado',
    victimaNombre: 'Marcos Juárez',
    victimaDni: '38123456',
    victimaPuesto: 'Operario de Depósito',
    victimaAntiguedad: '1 año 6 meses',
    lesion: 'Lumbalgia aguda por esfuerzo biomecánico',
    parteCuerpo: 'Columna Lumbar / Espalda',
    mecanismoAccidente: 'Sobreesfuerzo ergonómico / Levantamiento manual',
    parteCuerpoEspecifica: 'Columna Lumbar / Espalda',
    artNombre: 'Experta ART',
    numeroSiniestro: 'SIN-991204',
    centroMedico: 'Clínica de Traumatología',
    diasIltEstimados: '10',
    descripcionHecho: 'El operario levantó manualmente una caja de 32 kg desde el nivel del suelo girando el tronco sin ayuda mecánica ni apoyo de un compañero.',
    problemaCentral: 'Sobreesfuerzo muscular en levantamiento de carga pesada',
    porques: [
      'Levantamiento individual de bulto superior a 25 kg.',
      'Rotación del tronco durante el levantamiento.',
      'Indisponibilidad momentánea de la apiladora eléctrica.',
      'Incumplimiento de la Res. 886/15 y falta de pausas activas.'
    ]
  },
  {
    id: 'altura',
    label: '🪜 Caída a Distinto Nivel (>1.5m)',
    empresa: 'Constructora del Plata',
    ubicacion: 'Frente de Obra - Piso 2',
    gravedad: 'Grave',
    victimaNombre: 'Roberto Rossi',
    victimaDni: '31987654',
    victimaPuesto: 'Montador de Estructuras',
    victimaAntiguedad: '4 años',
    lesion: 'Politraumatismo y fractura de tobillo',
    parteCuerpo: 'Miembro Inferior Izquierdo / Tobillo',
    mecanismoAccidente: 'Caída a distinto nivel',
    parteCuerpoEspecifica: 'Miembro Inferior Izquierdo',
    artNombre: 'Prevención ART',
    numeroSiniestro: 'SIN-440192',
    centroMedico: 'Hospital de Urgencias',
    diasIltEstimados: '45',
    descripcionHecho: 'Durante el armado del andamio tubular a 2.80m de altura, el trabajador tropezó con un tablón suelto y cayó al vacío sin haber amarrado su arnés a la línea de vida.',
    problemaCentral: 'Caída desde andamio a 2.80 metros de altura',
    porques: [
      'Pérdida de equilibrio al pisar un tablón no fijado.',
      'Ausencia de rodapiés y barandas perimetrales completas en el andamio.',
      'Falta de enganche del cabo de vida al punto de anclaje.',
      'Supervisión deficiente del permiso de trabajo en altura.'
    ]
  },
  {
    id: 'electrico',
    label: '⚡ Descarga Eléctrica en Tablero',
    empresa: 'Servicios Industriales SA',
    ubicacion: 'Sala de Máquinas Principal',
    gravedad: 'Grave',
    victimaNombre: 'Gonzalo Fernández',
    victimaDni: '36543210',
    victimaPuesto: 'Electricista de Mantenimiento',
    victimaAntiguedad: '5 años',
    lesion: 'Quemadura de 2do grado en mano e inflamación',
    parteCuerpo: 'Mano Izquierda / Cuello',
    mecanismoAccidente: 'Contacto eléctrico directo / Arco eléctrico',
    parteCuerpoEspecifica: 'Mano / Dedos',
    artNombre: 'Galeno ART',
    numeroSiniestro: 'SIN-776512',
    centroMedico: 'Instituto del Quemado',
    diasIltEstimados: '21',
    descripcionHecho: 'Al intervenir en el tablero eléctrico secundario para reemplazar un térmico sin haber realizado el bloqueo LOTO previo, se generó un arco eléctrico al rozar la barra energizada con el destornillador.',
    problemaCentral: 'Descarga y arco eléctrico en tablero con tensión',
    porques: [
      'Contacto accidental con barra energizada.',
      'Intervención con tensión sin aplicar procedimiento de bloqueo LOTO.',
      'No utilización de guantes dieléctricos ni máscara de protección facial.',
      'Falta de verificación con multímetro del estado de tensión cero.'
    ]
  }
];

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'Leve' | 'Moderado' | 'GraveMortal'>('all');

  const metrics = useMemo(() => {
    const total = history.length;
    let leve = 0;
    let moderado = 0;
    let graveMortal = 0;

    history.forEach((item: any) => {
      const g = item?.gravedad;
      if (g === 'Leve') leve++;
      else if (g === 'Moderado') moderado++;
      else if (g === 'Grave' || g === 'Mortal') graveMortal++;
    });

    return { total, leve, moderado, graveMortal };
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter((item: any) => {
      if (statusFilter === 'Leve') return item.gravedad === 'Leve';
      if (statusFilter === 'Moderado') return item.gravedad === 'Moderado';
      if (statusFilter === 'GraveMortal') return item.gravedad === 'Grave' || item.gravedad === 'Mortal';
      return true;
    });
  }, [history, statusFilter]);

  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<any>({
    fecha: new Date().toISOString().split('T')[0],
    hora: '', empresa: '', ubicacion: '', gravedad: 'Leve',
    artNombre: '', numeroSiniestro: '', centroMedico: '', diasIltEstimados: '',
    victimaNombre: '', victimaDni: '', victimaPuesto: '', victimaAntiguedad: '', lesion: '', parteCuerpo: '',
    mecanismoAccidente: '', parteCuerpoEspecifica: '',
    condicionesAmbientales: {
      iluminacionDeficiente: false,
      ordenLimpiezaDeficiente: false,
      pisoResbaladizo: false,
      ruidoElevado: false,
      eppAusenteOInadecuado: false,
      ventilacionInsuficiente: false,
      faltaGuardaProteccion: false
    },
    hhtTotal: '100000',
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
        render: (item: any) => (
          <span style={{ color: '#000000', fontWeight: '900', fontSize: '13px', display: 'block' }}>
            {new Date(item.date || item.fecha).toLocaleDateString('es-AR')}
          </span>
        )
      },
      {
        header: 'Accidentado / Víctima',
        accessor: 'victimaNombre',
        sortable: true,
        render: (item: any) => (
          <div>
            <div style={{ color: '#000000', fontWeight: '900', fontSize: '14px', lineHeight: '1.2' }}>{item.victimaNombre || 'Sin nombre'}</div>
            <div style={{ color: '#475569', fontWeight: '700', fontSize: '12px', marginTop: '2px' }}>
              {item.empresa ? `${item.empresa}` : ''} {item.victimaDni ? `• DNI: ${item.victimaDni}` : ''}
            </div>
          </div>
        )
      },
      {
        header: 'Sector / Lesión',
        accessor: 'ubicacion',
        sortable: true,
        render: (item: any) => (
          <div>
            <span style={{ color: '#0f172a', fontWeight: '800', fontSize: '12px', display: 'block' }}>
              📍 {item.ubicacion || '—'}
            </span>
            <span style={{ color: '#64748b', fontWeight: '600', fontSize: '11px' }}>
              {item.lesion || 'Sin especificar'}
            </span>
          </div>
        )
      },
      {
        header: 'Gravedad',
        accessor: 'gravedad',
        sortable: true,
        render: (item: any) => {
          const g = item.gravedad;
          if (g === 'Leve') {
            return (
              <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> Leve (Sin Baja)
              </span>
            );
          }
          if (g === 'Moderado') {
            return (
              <span style={{ backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={13} /> Moderado (Con Baja)
              </span>
            );
          }
          if (g === 'Grave' || g === 'Mortal') {
            return (
              <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecdd3', padding: '4px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <XCircle size={13} /> {g.toUpperCase()}
              </span>
            );
          }
          return (
            <span style={{ backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '6px', fontWeight: '800', fontSize: '11px' }}>
              {g || '—'}
            </span>
          );
        }
      },
      {
        header: 'Acciones',
        accessor: 'id',
        render: (item: any) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setSelectedReport(item)} 
              style={{ backgroundColor: '#475569', color: '#ffffff', border: 'none', padding: '5px 11px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(71, 85, 105, 0.2)' }}>
              <FileText size={12} /> Ver PDF
            </button>
            
            <button 
              onClick={() => { setFormData(item); setIsEdit(true); setIsFormVisible(true); }} 
              style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '5px 11px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)' }}>
              <Pencil size={12} /> Editar
            </button>

            <button 
              onClick={() => requirePro(() => {
                const url = `${window.location.origin}/v/${currentUser?.uid}/accident/${item.id}?print=true`;
                setQrTarget({ text: url, title: `Accidente — ${item.victimaNombre}` });
              })} 
              style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '5px 11px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}>
              <QrCode size={12} /> QR
            </button>

            <button 
              onClick={() => requirePro(() => setShareItem(item))} 
              style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '5px 11px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)' }}>
              <Share2 size={12} /> Compartir
            </button>

            <button 
              onClick={() => setDeleteTarget(item.id)} 
              style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '5px 11px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)' }}>
              <Trash2 size={12} /> Eliminar
            </button>
          </div>
        )
      }
    ];

    return (
      <AnimatedPage>
        <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
          <div className="no-print">
            <PremiumHeader
              title="Investigaciones de Accidentes"
              subtitle="Gestión de siniestros laborales y análisis de causa raíz — Res. SRT 7/2026 y Dec. 549/2025"
              icon={<AlertTriangle size={36} color="#ffffff" />}
            />
          </div>

          {/* Top Summary Cards (KPIs) idénticos a Aptitudes Médicas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div 
              onClick={() => setStatusFilter('all')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                statusFilter === 'all' 
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md' 
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
              }`}>
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Registrados</span>
                <AlertTriangle size={20} />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.total}</div>
              <span className="text-[11px] text-slate-500">Investigaciones cargadas</span>
            </div>

            <div 
              onClick={() => setStatusFilter('Leve')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                statusFilter === 'Leve' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md' 
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
              }`}>
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Siniestros Leves</span>
                <CheckCircle2 size={20} />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.leve}</div>
              <span className="text-[11px] text-slate-500">Sin baja laboral</span>
            </div>

            <div 
              onClick={() => setStatusFilter('Moderado')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                statusFilter === 'Moderado' 
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md' 
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
              }`}>
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Con Baja (Moderados)</span>
                <AlertTriangle size={20} />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.moderado}</div>
              <span className="text-[11px] text-slate-500">Con días de baja (ILT)</span>
            </div>

            <div 
              onClick={() => setStatusFilter('GraveMortal')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                statusFilter === 'GraveMortal'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-md' 
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-rose-400'
              }`}>
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Graves / Mortales</span>
                <XCircle size={20} />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{metrics.graveMortal}</div>
              <span className="text-[11px] text-slate-500">Internación / Severos</span>
            </div>
          </div>

          {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
          {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
          <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`Investigación de Accidente - ${shareItem?.victimaNombre || ''}`} text={shareItem ? `⚠️ Informe de Investigación\n👤 Accidentado: ${shareItem.victimaNombre}\n🏢 Empresa: ${shareItem.empresa}\n📅 Fecha: ${shareItem.fecha}\n⚠️ Gravedad: ${shareItem.gravedad}` : ''} rawMessage={shareItem ? `⚠️ Informe de Investigación\n👤 Accidentado: ${shareItem.victimaNombre}\n🏢 Empresa: ${shareItem.empresa}` : ''} elementIdToPrint="pdf-content" fileName={`Accidente_${shareItem?.victimaNombre || 'Reporte'}.pdf`} />
          
          <div id="pdf-content" className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
            {(shareItem || printItem) && <AccidentPdfGenerator report={{ ...(shareItem || printItem), id: (shareItem || printItem).id || Date.now() }} isHeadless={true} />}
          </div>

          <main className="w-full max-w-[1200px] mx-auto pb-8 mt-6">
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <h3 className="m-0 text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="text-blue-500" size={22} />
                Historial de Siniestros e Investigaciones
              </h3>
              <div className="flex gap-3 items-center">
                {history.length > 0 && (
                  <button onClick={handleExportCSV} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }} className="flex items-center gap-1.5 border-none rounded-xl px-4 py-2.5 text-xs font-extrabold cursor-pointer text-white transition-transform hover:-translate-y-0.5">
                    <Download size={14} /> EXCEL
                  </button>
                )}
                <button onClick={() => setIsFormVisible(true)} className="flex items-center gap-2 px-5 py-2.5 w-auto m-0 bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none rounded-xl font-extrabold shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 transition-all cursor-pointer">
                  <Plus size={18} /> NUEVA INVESTIGACIÓN
                </button>
              </div>
            </div>

            <DataTable
              data={filteredHistory}
              columns={columns}
              searchPlaceholder="Buscar por empleado, DNI, empresa, sector o lesión..."
              searchFields={['victimaNombre', 'victimaDni', 'empresa', 'ubicacion', 'gravedad', 'lesion']}
              emptyMessage="No hay investigaciones registradas."
              emptyIcon={<FileText size={48} />}
            />
          </main>
        </div>
      </AnimatedPage>
    );
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

                    {currentStep === 0 && (
                      <div className="space-y-6">
                        {/* ⚡ Plantillas Rápidas de Accidentes Frecuentes */}
                        <div className="bg-blue-50/70 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50">
                          <p className="m-0 mb-2 text-xs font-black text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                            ⚡ Carga Rápida de Siniestros Frecuentes (Presets de Prueba / Auditoría):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {ACCIDENT_PRESETS.map((preset) => (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => {
                                  setFormData((prev: any) => ({
                                    ...prev,
                                    ...preset
                                  }));
                                  toast.success(`Cargada plantilla: ${preset.label}`);
                                }}
                                className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs font-bold hover:bg-blue-100 hover:text-blue-800 transition-all cursor-pointer shadow-sm"
                              >
                                + {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha del Suceso *</label>
                            <input type="date" value={formData.fecha} onChange={(e) => handleInputChange('fecha', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hora Aprox. *</label>
                            <input type="time" value={formData.hora} onChange={(e) => handleInputChange('hora', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Razón Social / Empresa *</label>
                            <input type="text" placeholder="Ej. Constructora SRL" value={formData.empresa} onChange={(e) => handleInputChange('empresa', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ubicación / Sector *</label>
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

                        {/* 🏥 Registro ART y Denuncia de Siniestro (Res. SRT 1552/12) */}
                        <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                          <h4 className="m-0 text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                            🏥 Registro de ART y Denuncia de Siniestro (Ley 24.557 / Res. 1552/12)
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div>
                              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Aseguradora ART</label>
                              <select
                                value={formData.artNombre}
                                onChange={(e) => handleInputChange('artNombre', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                              >
                                <option value="">Seleccionar ART...</option>
                                <option value="Provincia ART">Provincia ART</option>
                                <option value="Experta ART">Experta ART</option>
                                <option value="La Segunda ART">La Segunda ART</option>
                                <option value="Galeno ART">Galeno ART</option>
                                <option value="Prevención ART">Prevención ART</option>
                                <option value="SMG ART">SMG ART</option>
                                <option value="Berkley ART">Berkley ART</option>
                                <option value="Otra / OSECAC">Otra / OSECAC</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">N° de Siniestro ART</label>
                              <input
                                type="text"
                                placeholder="Ej. SIN-88912"
                                value={formData.numeroSiniestro}
                                onChange={(e) => handleInputChange('numeroSiniestro', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Centro Médico de Derivación</label>
                              <input
                                type="text"
                                placeholder="Ej. Sanatorio Central"
                                value={formData.centroMedico}
                                onChange={(e) => handleInputChange('centroMedico', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 📊 Calculador de Índices de Siniestralidad SRT (Res. 503/14) */}
                        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="m-0 text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                              📊 Calculador de Índices de Siniestralidad SRT (Res. 503/14)
                            </h4>
                            <span className="text-[10px] font-extrabold bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100 px-2 py-0.5 rounded-full">
                              Estadística Anual
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div>
                              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Horas Hombre Trabajadas (HHT Anual)</label>
                              <input
                                type="number"
                                value={formData.hhtTotal || '100000'}
                                onChange={(e) => handleInputChange('hhtTotal', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Días de Baja / ILT Estimados</label>
                              <input
                                type="number"
                                value={formData.diasIltEstimados || '0'}
                                onChange={(e) => handleInputChange('diasIltEstimados', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                              />
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 flex flex-col justify-center text-xs">
                              {(() => {
                                const hht = parseFloat(formData.hhtTotal) || 100000;
                                const ilt = parseFloat(formData.diasIltEstimados) || 0;
                                const ifVal = ((1 * 1000000) / hht).toFixed(2);
                                const igVal = ((ilt * 1000000) / hht).toFixed(2);
                                return (
                                  <div className="space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500 font-bold">Índice Frecuencia (IF):</span>
                                      <span className="font-black text-emerald-600 dark:text-emerald-400">{ifVal}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500 font-bold">Índice Gravedad (IG):</span>
                                      <span className="font-black text-blue-600 dark:text-blue-400">{igVal}</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStep === 1 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre del Accidentado *</label>
                          <input type="text" placeholder="Nombre completo" value={formData.victimaNombre} onChange={(e) => handleInputChange('victimaNombre', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">DNI / CUIL *</label>
                          <input type="text" placeholder="Sin guiones" value={formData.victimaDni} onChange={(e) => handleInputChange('victimaDni', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Puesto / Tarea *</label>
                          <input type="text" placeholder="Ej. Oficial Albañil" value={formData.victimaPuesto} onChange={(e) => handleInputChange('victimaPuesto', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Antigüedad en el puesto</label>
                          <input type="text" placeholder="Ej. 2 años" value={formData.victimaAntiguedad} onChange={(e) => handleInputChange('victimaAntiguedad', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mecanismo del Siniestro (Res. SRT 7/2026)</label>
                          <select value={formData.mecanismoAccidente} onChange={(e) => handleInputChange('mecanismoAccidente', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm">
                            <option value="">Seleccionar mecanismo...</option>
                            <option value="Contacto con objeto cortante en movimiento">Contacto con objeto cortante / herramienta en movimiento</option>
                            <option value="Atrapamiento en máquinas o equipos">Atrapamiento por/entre partes móviles de máquinas</option>
                            <option value="Caída a distinto nivel">Caída de altura / a distinto nivel</option>
                            <option value="Caída al mismo nivel">Caída al mismo nivel / resbalón / tropiezo</option>
                            <option value="Golpe por objeto caído o en movimiento">Golpe por objeto o herramienta en movimiento</option>
                            <option value="Contacto eléctrico directo / indirecto">Contacto eléctrico / Arco eléctrico</option>
                            <option value="Sobreesfuerzo ergonómico / Levantamiento manual">Sobreesfuerzo ergonómico / Levantamiento manual de carga (Res. 886/15)</option>
                            <option value="Exposición o contacto con sustancias químicas">Exposición / Contacto con agente químico o tóxico</option>
                            <option value="Quemadura térmica o por fricción">Quemadura térmica o por fricción</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Parte del Cuerpo Afectada (Normalizada)</label>
                          <select value={formData.parteCuerpoEspecifica} onChange={(e) => handleInputChange('parteCuerpoEspecifica', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm">
                            <option value="">Seleccionar región corporal...</option>
                            <option value="Cabeza / Rostro">Cabeza / Cráneo / Rostro</option>
                            <option value="Ojos / Visión">Ojos / Visión</option>
                            <option value="Cuello / Cervical">Cuello / Columna Cervical</option>
                            <option value="Columna Lumbar / Espalda">Columna Lumbar / Dorsal / Espalda</option>
                            <option value="Miembro Superior Izquierdo">Miembro Superior Izquierdo (Hombro / Brazo / Codo)</option>
                            <option value="Miembro Superior Derecho">Miembro Superior Derecho (Hombro / Brazo / Codo)</option>
                            <option value="Mano / Dedos">Mano / Muñeca / Dedos</option>
                            <option value="Tórax / Abdomen">Tórax / Abdomen / Pelvis</option>
                            <option value="Miembro Inferior Izquierdo">Miembro Inferior Izquierdo (Muslo / Rodilla / Tobillo)</option>
                            <option value="Miembro Inferior Derecho">Miembro Inferior Derecho (Muslo / Rodilla / Tobillo)</option>
                            <option value="Pie / Dedos Pie">Pie / Dedos del Pie</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Lesión Diagnóstica</label>
                          <input type="text" placeholder="Ej. Corte profundo, contusión, fractura..." value={formData.lesion} onChange={(e) => handleInputChange('lesion', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Detalle de Ubicación Anatómica</label>
                          <input type="text" placeholder="Ej. Mano derecha, falange distal índice" value={formData.parteCuerpo} onChange={(e) => handleInputChange('parteCuerpo', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm" />
                        </div>
                      </div>
                    )}

                    {currentStep === 2 && (
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

                        {/* 🗺️ Factores Ambientales y del Entorno de Trabajo */}
                        <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 space-y-4 shadow-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🗺️</span>
                            <h4 style={{ color: '#0f172a' }} className="m-0 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                              Factores Contribuyentes del Entorno (Checklist de Seguridad)
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              { id: 'iluminacionDeficiente', emoji: '💡', label: 'Iluminación insuficiente o encandilamiento' },
                              { id: 'ordenLimpiezaDeficiente', emoji: '🧹', label: 'Orden y limpieza deficiente (Housekeeping)' },
                              { id: 'pisoResbaladizo', emoji: '💧', label: 'Piso húmedo, resbaladizo o irregular' },
                              { id: 'ruidoElevado', emoji: '🎧', label: 'Ruido ambiente elevado (dificultó comunicación)' },
                              { id: 'eppAusenteOInadecuado', emoji: '🛡️', label: 'EPP ausente, en mal estado o no utilizado' },
                              { id: 'ventilacionInsuficiente', emoji: '💨', label: 'Ventilación insuficiente o gases/polvos' },
                              { id: 'faltaGuardaProteccion', emoji: '⚙️', label: 'Ausencia o anulación de guardas / LOTO' }
                            ].map((item) => {
                              const isChecked = !!formData.condicionesAmbientales?.[item.id];
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev: any) => ({
                                      ...prev,
                                      condicionesAmbientales: {
                                        ...(prev.condicionesAmbientales || {}),
                                        [item.id]: !isChecked
                                      }
                                    }));
                                  }}
                                  style={{
                                    backgroundColor: isChecked ? '#fef3c7' : '#ffffff',
                                    borderColor: isChecked ? '#f59e0b' : '#cbd5e1',
                                    color: '#0f172a'
                                  }}
                                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left shadow-sm ${
                                    isChecked
                                      ? 'ring-2 ring-amber-400/50 shadow-md scale-[1.01]'
                                      : 'hover:border-slate-400'
                                  }`}
                                >
                                  {/* Custom Checkbox Box */}
                                  <div
                                    style={{
                                      backgroundColor: isChecked ? '#f59e0b' : '#f1f5f9',
                                      borderColor: isChecked ? '#d97706' : '#94a3b8',
                                      color: isChecked ? '#ffffff' : '#475569'
                                    }}
                                    className="w-7 h-7 rounded-xl border flex items-center justify-center font-black text-sm shrink-0 transition-transform"
                                  >
                                    {isChecked ? '✓' : item.emoji}
                                  </div>

                                  <div className="flex flex-col">
                                    <span
                                      style={{ color: '#0f172a' }}
                                      className="font-extrabold text-xs text-slate-900 leading-snug break-words"
                                    >
                                      {item.label}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <AdjuntosSection
                          adjuntos={formData.fotos || []}
                          onAdd={(b64) => setFormData((prev: any) => ({ ...prev, fotos: [...(prev.fotos || []), b64] }))}
                          onRemove={(idx) => setFormData((prev: any) => ({ ...prev, fotos: (prev.fotos || []).filter((_: any, i: number) => i !== idx) }))}
                          accentColor="#3b82f6"
                        />
            

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
          )}

                    {currentStep === 3 && (
                      <div className="flex flex-col gap-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            El Problema / Incidente (Efecto Final)
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. El trabajador sufrió un corte con la amoladora en mano derecha"
                            value={formData.problemaCentral}
                            onChange={(e) => handleInputChange('problemaCentral', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white text-sm font-bold"
                          />
                        </div>

                        <RootCauseAnalyzer
                          problemStatement={formData.problemaCentral || formData.descripcionHecho}
                          initialData={{
                            method: 'both',
                            whys: formData.porques || ['', '', '', '', ''],
                            ishikawa: formData.ishikawa || {
                              manpower: [],
                              methodology: [],
                              machinery: [],
                              materials: [],
                              measurement: [],
                              environment: []
                            },
                            rootCauseSummary: formData.causaRaizFinal || ''
                          }}
                          onChange={(rca) => {
                            setFormData((prev: any) => ({
                              ...prev,
                              porques: rca.whys,
                              ishikawa: rca.ishikawa,
                              causaRaizFinal: rca.rootCauseSummary
                            }));
                          }}
                        />
                        {/* 🌳 Visual Diagram: Árbol de Causas (SRT Official Method) */}
                        <div className="mt-6 p-6 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-lg">
                          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm uppercase tracking-wider">
                              <TreeDeciduous size={20} /> Diagrama de Árbol de Causas (Metodología SRT)
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                              EN TIEMPO REAL
                            </span>
                          </div>

                          <div className="flex flex-col items-center gap-3">
                            {/* Accident Node */}
                            <div className="w-full max-w-md p-3.5 rounded-xl bg-red-600/20 border border-red-500/50 text-red-200 text-center font-extrabold text-xs shadow-md">
                              <span className="block text-[10px] uppercase font-black text-red-400 mb-1">💥 1. HECHO PRINCIPAL / EFECTO</span>
                              {formData.problemaCentral || 'Descripción del Accidente'}
                            </div>

                            {/* Flow Arrows & Intermediate Causes */}
                            {(formData.porques || []).filter((p: string) => p && p.trim()).map((pq: string, idx: number) => {
                              const cleanPorques = (formData.porques || []).filter((p: string) => p && p.trim());
                              const isLast = idx === cleanPorques.length - 1;
                              return (
                                <React.Fragment key={idx}>
                                  <div className="text-slate-500 font-black text-xs">↓ por qué ↓</div>
                                  <div className={`w-full max-w-md p-3.5 rounded-xl border text-center font-bold text-xs shadow-md ${
                                    isLast 
                                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-200' 
                                      : 'bg-amber-600/20 border-amber-500/50 text-amber-200'
                                  }`}>
                                    <span className={`block text-[10px] uppercase font-black mb-1 ${isLast ? 'text-blue-400' : 'text-amber-400'}`}>
                                      {isLast ? '🛠️ CAUSA RAÍZ DE GESTIÓN (SISTÉMICA)' : `🔻 CAUSA INMEDIATA N° ${idx + 1}`}
                                    </span>
                                    {pq}
                                  </div>
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

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

                            <div className="flex flex-col sm:flex-row gap-3 mt-2">
                                <button type="button" className="btn-outline hover-lift p-[0.8rem] text-[0.85rem] flex-1 justify-center rounded-[12px]" onClick={() => addArrayItem('medidas', { accion: '', responsable: '', fechaLimite: '' })}>
                                    <Plus size={16} /> Añadir otra Medida
                                </button>
                                <button type="button" style={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', padding: '0.8rem 1.2rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }} onClick={() => {
                                    const validMedidas = (formData.medidas || []).filter((m: any) => m.accion && m.accion.trim());
                                    if (validMedidas.length === 0) {
                                        toast.error('Ingrese al menos una medida correctiva con descripción.');
                                        return;
                                    }
                                    const existingCapas = JSON.parse(localStorage.getItem('ehs_capa_db') || '[]');
                                    const newCapas = validMedidas.map((m: any, idx: number) => ({
                                        id: `CAPA-ACC-${Date.now()}-${idx}`,
                                        createdAt: new Date().toISOString(),
                                        title: `[Accidente] ${m.accion}`,
                                        capaType: 'preventive',
                                        origin: 'Investigación de Accidente',
                                        description: `Medida preventiva por accidente de ${formData.victimaNombre || 'trabajador'} el ${formData.fecha || 'N/D'}. Empresa: ${formData.empresa || 'N/D'}.`,
                                        rootCause: (formData.porques || []).filter(Boolean).pop() || formData.problemaCentral || 'Investigación de Siniestro',
                                        actionPlan: m.accion,
                                        assignedTo: m.responsable || 'Seguridad e Higiene',
                                        targetDate: m.fechaLimite || '',
                                        priority: formData.gravedad === 'Mortal' || formData.gravedad === 'Grave' ? 'critical' : 'high',
                                        status: 'open'
                                    }));
                                    localStorage.setItem('ehs_capa_db', JSON.stringify([...newCapas, ...existingCapas]));
                                    toast.success(`🚀 ${newCapas.length} acción(es) exportada(s) con éxito al Módulo CAPA`);
                                }}>
                                    <Sparkles size={18} /> Exportar Acciones al Módulo CAPA
                                </button>
                            </div>
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