import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import { db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp, collection } from 'firebase/firestore';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import { Printer, Share2, Camera, X } from 'lucide-react';
import {
  Building2,
  PenTool,
  Flame,
  ShieldCheck,
  AlertTriangle,
  Wind,
  Save,
  ArrowLeft,
  CheckCircle2 } from
'lucide-react';
import LegajoPdf from '../components/LegajoPdf';
import PremiumHeader from '../components/PremiumHeader';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

const TABS = [
{ id: 'empresa', label: 'Empresa', icon: Building2, color: '#2563eb' },
{ id: 'riesgos', label: 'Riesgos', icon: AlertTriangle, color: '#dc2626' },
{ id: 'incendio', label: 'Incendio', icon: Flame, color: '#ea580c' },
{ id: 'epp', label: 'EPP', icon: ShieldCheck, color: '#16a34a' },
{ id: 'ambiente', label: 'Ambiente', icon: Wind, color: '#0d9488' },
{ id: 'instalaciones', label: 'Instalaciones', icon: AlertTriangle, color: '#0891b2' },
{ id: 'orden', label: 'Orden y Señal.', icon: ShieldCheck, color: '#4f46e5' },
{ id: 'firmas', label: 'Firmas', icon: PenTool, color: '#7c3aed' }];


const DEFAULT_FORM_DATA = {
  empresa: {
    razonSocial: '',
    cuit: '',
    domicilio: '',
    localidad: '',
    actividad: '',
    art: '',
    cantidadEmpleados: '',
    superficie: '',
    provincia: '',
    codigoPostal: '',
    telefono: '',
    email: '',
    responsableSeguridad: '',
    matriculaResponsable: '',
    representanteLegal: '',
    polizaArt: '',
    horariosTrabajo: '',
    fechaInicioActividad: '',
    ciiu: '',
    srt: '',
    modalidadTurno: '',
    cantidadMujeres: '',
    cantidadMenores: ''
  },
  riesgos: {
    matriz: [] as any[],
    medidasPreventivas: '',
    nivelRiesgo: '',
    observaciones: '',
    adjuntos: [] as string[]
  },
  incendio: {
    cargaFuego: '',
    riesgoIncendio: '',
    cantidadExtintores: '',
    tipoExtintores: '',
    planEvacuacion: false,
    fechaSimulacro: '',
    sistemaDeteccion: false,
    redHidrantes: false,
    brigadaEmergencia: false,
    planoEvacuacion: false,
    adjuntos: [] as string[]
  },
  epp: {
    ropaTrabajo: false,
    calzadoSeguridad: false,
    proteccionOcular: false,
    proteccionAuditiva: false,
    proteccionRespiratoria: false,
    capacitacionRealizada: '',
    proximaCapacitacion: '',
    cascoSeguridad: false,
    guantesSeguridad: false,
    arnesSeguridad: false,
    proteccionFacial: false,
    chalecoReflectivo: false,
    planAnualCapacitacion: '',
    adjuntos: [] as string[]
  },
  ambiente: {
    iluminacionFecha: '', iluminacionApto: true, iluminacionValor: '', iluminacionLimite: '', iluminacionEmpresa: '', iluminacionProtocolo: '',
    ruidoFecha: '', ruidoApto: true, ruidoValor: '', ruidoLimite: '', ruidoEmpresa: '', ruidoProtocolo: '',
    puestaTierraFecha: '', puestaTierraApto: true, puestaTierraValor: '', puestaTierraLimite: '', puestaTierraEmpresa: '', puestaTierraProtocolo: '',
    estresTermicoFecha: '', estresTermicoApto: true, estresTermicoValor: '', estresTermicoLimite: '', estresTermicoEmpresa: '', estresTermicoProtocolo: '',
    ventilacionFecha: '', ventilacionApto: true, ventilacionValor: '', ventilacionLimite: '', ventilacionEmpresa: '', ventilacionProtocolo: '',
    contaminantesFecha: '', contaminantesApto: true, contaminantesValor: '', contaminantesLimite: '', contaminantesEmpresa: '', contaminantesProtocolo: '',
    adjuntos: [] as string[]
  },
  instalaciones: {
    tablerosElectricos: false,
    proteccionDiferencial: false,
    patVerificada: false,
    estadoCableado: '',
    certificadoElectricista: false,
    guardasProteccion: false,
    parosEmergencia: false,
    mantenimientoPreventivo: false,
    hojasSeguridad: false,
    gasHabilitacion: false,
    gasValvulas: false,
    gasDetector: false,
    gasEnargas: false,
    adjuntos: [] as string[]
  },
  orden: {
    pasajesLibres: false,
    almacenamientoDelimitado: false,
    gestionResiduos: false,
    iram10005: false,
    senalizacionEscape: false,
    zonasPeligrosas: false,
    sanitariosCantidad: '',
    vestuarios: false,
    comedor: false,
    botiquinCompleto: false,
    responsablePrimerosAuxilios: '',
    distanciaCentroAsistencial: '',
    adjuntos: [] as string[]
  },
  firmas: {
    profesional: '',
    representante: ''
  }
};

/* ── Reusable Adjuntos (file attachment) component ── */
function AdjuntosSection({
  adjuntos,
  onAdd,
  onRemove,
  accentColor = '#2563eb'





}: {adjuntos: string[];onAdd: (base64: string) => void;onRemove: (index: number) => void;accentColor?: string;}) {
  const fileRef = useRef<HTMLInputElement>(null);

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
    // reset so the same file can be picked again
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="mt-5">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        Archivos Adjuntos
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles} className="none" />

      
      <button type="button" onClick={() => fileRef.current?.click()}
      className="inline-flex items-center gap-2 py-2 px-4 rounded-xl font-semibold text-sm cursor-pointer" style={{ background: accentColor + '14', color: accentColor, border: `1px solid ${accentColor}44` }}>
        
        <Camera size={16} /> Adjuntar Foto/Documento
      </button>
      {adjuntos.length > 0 &&
      <div className="flex flex-wrap gap-3 mt-3">
          {adjuntos.map((src, idx) =>
        <div key={idx} className="relative w-24 h-24">
              <img
            src={src}
            alt={`adjunto-${idx}`}
            className="w-24 h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
          
              <button
            type="button"
            onClick={() => onRemove(idx)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white border-none cursor-pointer flex items-center justify-center p-0">
            
                <X size={13} />
              </button>
            </div>
        )}
        </div>
      }
    </div>);

}

/* ── Progress calculation ── */
function calcTabProgress(section: Record<string, any>): number {
  const keys = Object.keys(section);
  if (keys.length === 0) return 0;
  let filled = 0;
  let total = 0;
  for (const k of keys) {
    const v = section[k];
    // skip arrays (adjuntos) from progress
    if (Array.isArray(v)) continue;
    total++;
    if (typeof v === 'boolean') {
      if (v) filled++;
    } else if (typeof v === 'string') {
      if (v.trim().length > 0) filled++;
    }
  }
  return total === 0 ? 0 : Math.round(filled / total * 100);
}

export default function LegajoForm() {
  const { requirePro } = usePaywall();
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { isPro } = usePaywall();
  const isAdmin = currentUser?.email?.toLowerCase().trim() === 'enzorodriguez31@gmail.com';
  const hasAccess = isPro || isAdmin;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('empresa');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [formData, setFormData] = useState({ ...DEFAULT_FORM_DATA });

  useEffect(() => {
    window.scrollTo(0, 0);

    // PAYWALL ENFORCEMENT
    if (currentUser && !hasAccess) {
      navigate('/subscribe', { replace: true });
      return;
    }

    if (id && currentUser) {
      loadLegajo(id);
    }
  }, [id, currentUser, hasAccess, navigate]);

  const loadLegajo = async (legajoId: string) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'users', currentUser.uid, 'legajos', legajoId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Deep merge: spread defaults first, then stored data on top
        setFormData({
          empresa: { ...DEFAULT_FORM_DATA.empresa, ...(data.empresa || {}) },
          riesgos: { ...DEFAULT_FORM_DATA.riesgos, ...(data.riesgos || {}) },
          incendio: { ...DEFAULT_FORM_DATA.incendio, ...(data.incendio || {}) },
          epp: { ...DEFAULT_FORM_DATA.epp, ...(data.epp || {}) },
          ambiente: { ...DEFAULT_FORM_DATA.ambiente, ...(data.ambiente || {}) },
          firmas: { ...DEFAULT_FORM_DATA.firmas, ...(data.firmas || {}) },
          instalaciones: { ...DEFAULT_FORM_DATA.instalaciones, ...(data.instalaciones || {}) },
          orden: { ...DEFAULT_FORM_DATA.orden, ...(data.orden || {}) }
        });
      }
    } catch (error) {
      console.error("Error loading legajo", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const docRef = id ?
      doc(db, 'users', currentUser.uid, 'legajos', id) :
      doc(collection(db, 'users', currentUser.uid, 'legajos'));

      const legajoData = {
        ...formData,
        companyName: formData.empresa.razonSocial,
        cuit: formData.empresa.cuit,
        updatedAt: Date.now()
      };

      await setDoc(docRef, legajoData, { merge: true });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);

      if (!id) {
        navigate(`/legajos/editar/${docRef.id}`, { replace: true });
      }
    } catch (error) {
      console.error("Error saving legajo", error);
      alert("Error al guardar los datos");
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!hasAccess) {
      alert("La exportación a PDF requiere una suscripción PRO");
      navigate('/subscribe');
      return;
    }

    try {
      setTimeout(() => {
        window.print();
      }, 500);
    } catch (error) {
      console.error("Error generating PDF", error);
      alert("Hubo un error al generar el PDF");
    }
  };

  const handleChange = (section: keyof typeof formData, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  /* helpers for adjuntos */
  const addAdjunto = (section: 'riesgos' | 'incendio' | 'epp' | 'ambiente', base64: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        adjuntos: [...(prev[section].adjuntos || []), base64]
      }
    }));
  };

  const removeAdjunto = (section: 'riesgos' | 'incendio' | 'epp' | 'ambiente', index: number) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        adjuntos: (prev[section].adjuntos || []).filter((_: any, i: number) => i !== index)
      }
    }));
  };

  if (loading) return <div className="text-center p-12 pt-32">Cargando datos del legajo...</div>;



  return (
    <div className="pt-24 pb-20 min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="print-only fixed left-0 top-0 opacity-0 pointer-events-none">
          <div id="pdf-content">
              <LegajoPdf data={{ ...formData, professionalName: currentUser?.displayName || 'Profesional H&S' }} />
          </div>
      </div>
      <main className="px-4 py-8 max-w-[1000px] mx-auto flex flex-col gap-6">
        <PremiumHeader
          title={id ? 'Editar Legajo Técnico' : 'Nuevo Legajo Técnico'}
          subtitle="Decreto 351/79"
          icon={<Building2 size={32} color="#ffffff" />}
          color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
        

        <div>
            <></>
        </div>

      {/* ═══ Tabs ═══ */}
      <div className="flex overflow-x-auto gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const sectionData = (formData as any)[tab.id];
            const progress = sectionData ? calcTabProgress(sectionData) : 0;
            const statusIcon = progress === 100 ? '✅' : progress > 0 ? '⚠️' : '';

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center gap-1 py-2.5 px-3 rounded-lg font-semibold text-xs whitespace-nowrap flex-1 cursor-pointer transition-all relative" style={{ border: isActive ? `1px solid ${tab.color}33` : '1px solid transparent', background: isActive ? tab.color + '18' : 'transparent', color: isActive ? tab.color : '#64748b' }}>
                
              <div className="flex items-center gap-1.5">
                <Icon className="w-4 h-4" style={{ color: isActive ? tab.color : '#94a3b8' }} />
                <span>{tab.label}</span>
                {statusIcon && <span className="text-[0.7rem]">{statusIcon}</span>}
              </div>
              {/* Progress bar */}
              <div className="w-full h-1 rounded-sm bg-slate-200 dark:bg-slate-700 overflow-hidden mt-0.5">
                <div className="h-full rounded-sm transition-all duration-300" style={{ width: `${progress}%`, background: tab.color }} />
              </div>
            </button>);

          })}
      </div>

      {/* ═══ Forms Area ═══ */}
      <div className="card p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm">
        
        
        {/* ═══ EMPRESA TAB ═══ */}
        {activeTab === 'empresa' &&
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-[0_4px_15px_rgba(37,99,235,0.3)]">
                  <Building2 size={22} color="#fff" />
              </div>
              <div>
                  <h2 className="m-0 text-xl font-extrabold text-slate-800 dark:text-slate-100">Datos del Establecimiento</h2>
                  <p className="m-0 text-sm text-slate-500 dark:text-slate-400">Información general de la empresa</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Razón Social</label>
                <input
                  type="text"
                  value={formData.empresa.razonSocial}
                  onChange={(e) => handleChange('empresa', 'razonSocial', e.target.value)}
                  className="input-professional"
                  placeholder="Ej: Metalúrgica San Martín S.A." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CUIT</label>
                <input
                  type="text"
                  value={formData.empresa.cuit}
                  onChange={(e) => handleChange('empresa', 'cuit', e.target.value)}
                  className="input-professional"
                  placeholder="30-12345678-9" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Domicilio Completo</label>
                <input
                  type="text"
                  value={formData.empresa.domicilio}
                  onChange={(e) => handleChange('empresa', 'domicilio', e.target.value)}
                  className="input-professional"
                  placeholder="Calle, Número, Piso, Dpto" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Localidad</label>
                <input type="text" value={formData.empresa.localidad} onChange={(e) => handleChange('empresa', 'localidad', e.target.value)} className="input-professional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provincia</label>
                <input type="text" value={formData.empresa.provincia} onChange={(e) => handleChange('empresa', 'provincia', e.target.value)} className="input-professional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código Postal</label>
                <input type="text" value={formData.empresa.codigoPostal} onChange={(e) => handleChange('empresa', 'codigoPostal', e.target.value)} className="input-professional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input type="tel" value={formData.empresa.telefono} onChange={(e) => handleChange('empresa', 'telefono', e.target.value)} className="input-professional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={formData.empresa.email} onChange={(e) => handleChange('empresa', 'email', e.target.value)} className="input-professional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Actividad Principal</label>
                <input type="text" value={formData.empresa.actividad} onChange={(e) => handleChange('empresa', 'actividad', e.target.value)} className="input-professional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código CIIU (Actividad ART)</label>
                <input type="text" value={formData.empresa.ciiu} onChange={(e) => handleChange('empresa', 'ciiu', e.target.value)} className="input-professional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nº Establecimiento SRT</label>
                <input type="text" value={formData.empresa.srt} onChange={(e) => handleChange('empresa', 'srt', e.target.value)} className="input-professional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Aseguradora (ART)</label>
                <input type="text" value={formData.empresa.art} onChange={(e) => handleChange('empresa', 'art', e.target.value)} className="input-professional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Póliza ART</label>
                <input type="text" value={formData.empresa.polizaArt} onChange={(e) => handleChange('empresa', 'polizaArt', e.target.value)} className="input-professional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad de Empleados</label>
                <input type="number" value={formData.empresa.cantidadEmpleados} onChange={(e) => handleChange('empresa', 'cantidadEmpleados', e.target.value)} className="input-professional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad de Mujeres</label>
                <input type="number" value={formData.empresa.cantidadMujeres} onChange={(e) => handleChange('empresa', 'cantidadMujeres', e.target.value)} className="input-professional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad de Menores</label>
                <input type="number" value={formData.empresa.cantidadMenores} onChange={(e) => handleChange('empresa', 'cantidadMenores', e.target.value)} className="input-professional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Superficie (m²)</label>
                <input type="number" value={formData.empresa.superficie} onChange={(e) => handleChange('empresa', 'superficie', e.target.value)} className="input-professional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Horarios de Trabajo</label>
                <input type="text" value={formData.empresa.horariosTrabajo} onChange={(e) => handleChange('empresa', 'horariosTrabajo', e.target.value)} className="input-professional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Modalidad de Turno</label>
                <select value={formData.empresa.modalidadTurno} onChange={(e) => handleChange('empresa', 'modalidadTurno', e.target.value)} className="input-professional">
                  <option value="">Seleccione...</option>
                  <option value="Diurno">Diurno</option>
                  <option value="Nocturno">Nocturno</option>
                  <option value="Rotativo">Rotativo</option>
                  <option value="Fraccionado">Fraccionado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio de Actividad</label>
                <input type="date" value={formData.empresa.fechaInicioActividad} onChange={(e) => handleChange('empresa', 'fechaInicioActividad', e.target.value)} className="input-professional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Representante Legal</label>
                <input type="text" value={formData.empresa.representanteLegal} onChange={(e) => handleChange('empresa', 'representanteLegal', e.target.value)} className="input-professional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Responsable de Seguridad</label>
                <input type="text" value={formData.empresa.responsableSeguridad} onChange={(e) => handleChange('empresa', 'responsableSeguridad', e.target.value)} className="input-professional" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula del Responsable</label>
                <input type="text" value={formData.empresa.matriculaResponsable} onChange={(e) => handleChange('empresa', 'matriculaResponsable', e.target.value)} className="input-professional" />
              </div>
            </div>
          </div>
          }

        
        {/* ═══ RIESGOS TAB ═══ */}
        {activeTab === 'riesgos' &&
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-11 h-11 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-[0_4px_15px_rgba(220,38,38,0.3)]">
                  <AlertTriangle size={22} color="#fff" />
              </div>
              <div>
                  <h2 className="m-0 text-xl font-extrabold text-slate-800 dark:text-slate-100">Matriz de Riesgos</h2>
                  <p className="m-0 text-sm text-slate-500 dark:text-slate-400">Identificación, evaluación y control</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Dynamic Risk Matrix */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-700 dark:text-slate-200">Riesgos Identificados</h3>
                  <button 
                    type="button" 
                    onClick={() => {
                      const newMatriz = [...(formData.riesgos.matriz || []), { id: Date.now().toString(), tipo: '', descripcion: '', probabilidad: '', consecuencia: '', nivel: '', expuestos: '', puesto: '', medida: '', plazo: '' }];
                      handleChange('riesgos', 'matriz', newMatriz);
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    + Agregar Riesgo
                  </button>
                </div>
                
                {(formData.riesgos.matriz || []).map((riesgo: any, index: number) => {
                  const calcNivel = (p: string, c: string) => {
                    if(!p || !c) return '';
                    const pVal = p === 'Alta' ? 3 : p === 'Media' ? 2 : 1;
                    const cVal = c === 'Fatal' ? 4 : c === 'Grave' ? 3 : c === 'Moderada' ? 2 : 1;
                    const res = pVal * cVal;
                    if(res >= 9) return 'Crítico';
                    if(res >= 6) return 'Alto';
                    if(res >= 3) return 'Medio';
                    return 'Bajo';
                  };
                  
                  const updateRiesgo = (field: string, val: any) => {
                    const newMatriz = [...formData.riesgos.matriz];
                    newMatriz[index] = { ...newMatriz[index], [field]: val };
                    if(field === 'probabilidad' || field === 'consecuencia') {
                      newMatriz[index].nivel = calcNivel(newMatriz[index].probabilidad, newMatriz[index].consecuencia);
                    }
                    handleChange('riesgos', 'matriz', newMatriz);
                  };

                  return (
                    <div key={riesgo.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-4 shadow-sm relative">
                      <button 
                        type="button"
                        onClick={() => {
                          const newMatriz = formData.riesgos.matriz.filter((_: any, i: number) => i !== index);
                          handleChange('riesgos', 'matriz', newMatriz);
                        }}
                        className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1"
                      >
                        <X size={18} />
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Tipo</label>
                          <select value={riesgo.tipo} onChange={e => updateRiesgo('tipo', e.target.value)} className="input-professional py-2">
                            <option value="">Seleccionar...</option>
                            <option value="Físico">Físico</option>
                            <option value="Químico">Químico</option>
                            <option value="Biológico">Biológico</option>
                            <option value="Ergonómico">Ergonómico</option>
                            <option value="Eléctrico">Eléctrico</option>
                            <option value="Mecánico">Mecánico</option>
                            <option value="Incendio">Incendio</option>
                            <option value="Psicosocial">Psicosocial</option>
                            <option value="Altura">Trabajo en Altura</option>
                            <option value="Confinados">Espacios Confinados</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Descripción del Peligro</label>
                          <input type="text" value={riesgo.descripcion} onChange={e => updateRiesgo('descripcion', e.target.value)} className="input-professional py-2" placeholder="Ej: Contacto con partes móviles de la máquina..." />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Puesto / Sector</label>
                          <input type="text" value={riesgo.puesto} onChange={e => updateRiesgo('puesto', e.target.value)} className="input-professional py-2" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Expuestos</label>
                          <input type="number" value={riesgo.expuestos} onChange={e => updateRiesgo('expuestos', e.target.value)} className="input-professional py-2" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Probabilidad</label>
                          <select value={riesgo.probabilidad} onChange={e => updateRiesgo('probabilidad', e.target.value)} className="input-professional py-2">
                            <option value="">...</option>
                            <option value="Baja">Baja (1)</option>
                            <option value="Media">Media (2)</option>
                            <option value="Alta">Alta (3)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Consecuencia</label>
                          <select value={riesgo.consecuencia} onChange={e => updateRiesgo('consecuencia', e.target.value)} className="input-professional py-2">
                            <option value="">...</option>
                            <option value="Leve">Leve (1)</option>
                            <option value="Moderada">Moderada (2)</option>
                            <option value="Grave">Grave (3)</option>
                            <option value="Fatal">Fatal (4)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Medida de Control Propuesta</label>
                          <input type="text" value={riesgo.medida} onChange={e => updateRiesgo('medida', e.target.value)} className="input-professional py-2" placeholder="Ej: Colocación de resguardos físicos" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Plazo Corrección</label>
                          <input type="date" value={riesgo.plazo} onChange={e => updateRiesgo('plazo', e.target.value)} className="input-professional py-2" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Nivel Riesgo</label>
                          <div className={`w-full text-center font-bold py-2 px-3 rounded-lg border ${riesgo.nivel === 'Crítico' ? 'bg-red-100 text-red-800 border-red-300' : riesgo.nivel === 'Alto' ? 'bg-orange-100 text-orange-800 border-orange-300' : riesgo.nivel === 'Medio' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : riesgo.nivel === 'Bajo' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>
                            {riesgo.nivel || '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!formData.riesgos.matriz || formData.riesgos.matriz.length === 0) && (
                  <p className="text-center text-sm text-slate-500 py-4">No hay riesgos cargados en la matriz. Agregue uno para comenzar.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Medidas Preventivas Generales (Histórico)</label>
                <textarea rows={3} value={formData.riesgos.medidasPreventivas} onChange={(e) => handleChange('riesgos', 'medidasPreventivas', e.target.value)} className="input-professional" placeholder="Medidas a nivel planta..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nivel de Riesgo General</label>
                  <select value={formData.riesgos.nivelRiesgo} onChange={(e) => handleChange('riesgos', 'nivelRiesgo', e.target.value)} className="input-professional">
                    <option value="">Seleccione...</option>
                    <option value="Bajo">Bajo</option>
                    <option value="Medio">Medio</option>
                    <option value="Alto">Alto</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                <textarea rows={3} value={formData.riesgos.observaciones} onChange={(e) => handleChange('riesgos', 'observaciones', e.target.value)} className="input-professional" />
              </div>
            </div>
            
            <AdjuntosSection
              adjuntos={formData.riesgos.adjuntos || []}
              onAdd={(b64) => addAdjunto('riesgos', b64)}
              onRemove={(i) => removeAdjunto('riesgos', i)}
              accentColor="#dc2626" />
          </div>
          }

        {/* ═══ INCENDIO TAB ═══ */}
        {activeTab === 'incendio' &&
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-11 h-11 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl flex items-center justify-center shadow-[0_4px_15px_rgba(234,88,12,0.3)]">
                  <Flame size={22} color="#fff" />
              </div>
              <div>
                  <h2 className="m-0 text-xl font-extrabold text-slate-800 dark:text-slate-100">Protección Contra Incendios</h2>
                  <p className="m-0 text-sm text-slate-500 dark:text-slate-400">Estudio de carga de fuego y sistemas</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Carga de Fuego Calculada (Mcal/m²)</label>
                <input
                  type="text"
                  value={formData.incendio.cargaFuego}
                  onChange={(e) => handleChange('incendio', 'cargaFuego', e.target.value)}
                  className="input-professional" />
                
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Riesgo de Incendio (R1 a R7)</label>
                <select
                  value={formData.incendio.riesgoIncendio}
                  onChange={(e) => handleChange('incendio', 'riesgoIncendio', e.target.value)}
                  className="input-professional">
                  
                  <option value="">Seleccione...</option>
                  <option value="R1">Riesgo 1 (Explosivo)</option>
                  <option value="R2">Riesgo 2 (Inflamable)</option>
                  <option value="R3">Riesgo 3 (Muy Combustible)</option>
                  <option value="R4">Riesgo 4 (Combustible)</option>
                  <option value="R5">Riesgo 5 (Poco Combustible)</option>
                  <option value="R6">Riesgo 6 (Incombustible)</option>
                  <option value="R7">Riesgo 7 (Refractario)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad Total de Extintores</label>
                <input
                  type="number"
                  value={formData.incendio.cantidadExtintores}
                  onChange={(e) => handleChange('incendio', 'cantidadExtintores', e.target.value)}
                  className="input-professional" />
                
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Extintores</label>
                <input
                  type="text"
                  value={formData.incendio.tipoExtintores}
                  onChange={(e) => handleChange('incendio', 'tipoExtintores', e.target.value)}
                  className="input-professional"
                  placeholder="Ej: ABC, CO2, Agua" />
                
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Último Simulacro</label>
                <input
                  type="date"
                  value={formData.incendio.fechaSimulacro}
                  onChange={(e) => handleChange('incendio', 'fechaSimulacro', e.target.value)}
                  className="input-professional" />
                
              </div>
            </div>

            <div className="mt-4">
              <p className="block text-sm font-medium text-slate-700 mb-3">Sistemas de Protección</p>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.incendio.planEvacuacion} onChange={(e) => handleChange('incendio', 'planEvacuacion', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Plan de Evacuación</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.incendio.sistemaDeteccion} onChange={(e) => handleChange('incendio', 'sistemaDeteccion', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Sistema de Detección</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.incendio.redHidrantes} onChange={(e) => handleChange('incendio', 'redHidrantes', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Red de Hidrantes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.incendio.brigadaEmergencia} onChange={(e) => handleChange('incendio', 'brigadaEmergencia', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Brigada de Emergencia</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.incendio.planoEvacuacion} onChange={(e) => handleChange('incendio', 'planoEvacuacion', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Plano de Evacuación</span>
                </label>
              </div>
            </div>
            <AdjuntosSection
              adjuntos={formData.incendio.adjuntos || []}
              onAdd={(b64) => addAdjunto('incendio', b64)}
              onRemove={(i) => removeAdjunto('incendio', i)}
              accentColor="#ea580c" />
            
          </div>
          }

        {/* ═══ EPP TAB ═══ */}
        {activeTab === 'epp' &&
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-[0_4px_15px_rgba(22,163,74,0.3)]">
                  <ShieldCheck size={22} color="#fff" />
              </div>
              <div>
                  <h2 className="m-0 text-xl font-extrabold text-slate-800 dark:text-slate-100">EPP y Capacitaciones</h2>
                  <p className="m-0 text-sm text-slate-500 dark:text-slate-400">Entrega de elementos e instrucción</p>
              </div>
            </div>
            
            <div>
              <p className="block text-sm font-medium text-slate-700 mb-3">Elementos de Protección Personal (Res 299/11)</p>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.ropaTrabajo} onChange={(e) => handleChange('epp', 'ropaTrabajo', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Ropa de Trabajo</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.calzadoSeguridad} onChange={(e) => handleChange('epp', 'calzadoSeguridad', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Calzado de Seguridad</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.proteccionOcular} onChange={(e) => handleChange('epp', 'proteccionOcular', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Protección Ocular</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.proteccionAuditiva} onChange={(e) => handleChange('epp', 'proteccionAuditiva', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Protección Auditiva</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.proteccionRespiratoria} onChange={(e) => handleChange('epp', 'proteccionRespiratoria', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Protección Respiratoria</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.cascoSeguridad} onChange={(e) => handleChange('epp', 'cascoSeguridad', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Casco de Seguridad</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.guantesSeguridad} onChange={(e) => handleChange('epp', 'guantesSeguridad', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Guantes de Seguridad</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.arnesSeguridad} onChange={(e) => handleChange('epp', 'arnesSeguridad', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Arnés de Seguridad</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.proteccionFacial} onChange={(e) => handleChange('epp', 'proteccionFacial', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Protección Facial</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.chalecoReflectivo} onChange={(e) => handleChange('epp', 'chalecoReflectivo', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Chaleco Reflectivo</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-700">Capacitación Realizada (Temas)</label>
                    <button
                    type="button"
                    onClick={() => {
                      const history = JSON.parse(localStorage.getItem('training_history') || '[]');
                      const match = history.filter((h: any) => h.empresa?.toLowerCase().trim() === formData.empresa.razonSocial?.toLowerCase().trim());
                      if (match.length > 0) {
                        const temas = match.map((h: any) => h.tema).join(' | ');
                        handleChange('epp', 'capacitacionRealizada', temas);
                        alert(`Sincronizado: ${match.length} capacitaciones encontradas.`);
                      } else {
                        alert("No se encontraron capacitaciones para esta empresa.");
                      }
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 bg-transparent border-none cursor-pointer font-semibold hover:underline">
                    
                        Sincronizar Módulo Capacitaciones
                    </button>
                </div>
                <textarea
                  rows={2}
                  value={formData.epp.capacitacionRealizada}
                  onChange={(e) => handleChange('epp', 'capacitacionRealizada', e.target.value)}
                  className="input-professional"
                  placeholder="Uso de extintores - 15/05/2024" />
                
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Próxima Capacitación Programada</label>
                <textarea
                  rows={2}
                  value={formData.epp.proximaCapacitacion}
                  onChange={(e) => handleChange('epp', 'proximaCapacitacion', e.target.value)}
                  className="input-professional"
                  placeholder="Riesgo Eléctrico - Octubre 2024" />
                
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Plan Anual de Capacitación</label>
                <textarea
                  rows={4}
                  value={formData.epp.planAnualCapacitacion}
                  onChange={(e) => handleChange('epp', 'planAnualCapacitacion', e.target.value)}
                  className="input-professional"
                  placeholder="Detalle del plan anual de capacitación en seguridad e higiene..." />
                
              </div>
            </div>
            <AdjuntosSection
              adjuntos={formData.epp.adjuntos || []}
              onAdd={(b64) => addAdjunto('epp', b64)}
              onRemove={(i) => removeAdjunto('epp', i)}
              accentColor="#16a34a" />
            
          </div>
          }


        {/* ═══ FIRMAS TAB ═══ */}
        {activeTab === 'firmas' &&
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-11 h-11 bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl flex items-center justify-center shadow-[0_4px_15px_rgba(124,58,237,0.3)]">
                  <PenTool size={22} color="#fff" />
              </div>
              <div>
                  <h2 className="m-0 text-xl font-extrabold text-slate-800 dark:text-slate-100">Firmas del Documento</h2>
                  <p className="m-0 text-sm text-slate-500 dark:text-slate-400">Certificación del legajo técnico</p>
              </div>
            </div>
            
            <div className="mb-10">
              <PdfSignatures
                data={{
                  ...formData,
                  professionalSignature: formData.firmas.profesional,
                  professionalName: currentUser?.displayName || 'Profesional H&S',
                  companyName: formData.empresa.razonSocial || 'Empresa'
                }}
                box1={{
                  title: 'REPRESENTANTE EMPRESA',
                  subtitle: (formData.empresa.razonSocial || 'Firma Representante').toUpperCase(),
                  signatureUrl: formData.firmas.representante || null,
                  isProfessional: false
                }}
                box2={{
                  title: 'PROFESIONAL H&S',
                  subtitle: (currentUser?.displayName || 'Especialista H&S').toUpperCase(),
                  signatureUrl: formData.firmas.profesional || null,
                  stampUrl: null,
                  isProfessional: true,
                  license: 'Matrícula en trámite'
                }}
                box3={null} />
              
            <PdfBrandingFooter />
            </div>

            <div className="no-print animate-fade-in grid grid-cols-1 gap-8 mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="card p-[1rem] bg-[rgba(var(--color-surface-rgb),_0.3)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)]">
                        <SignatureCanvas
                    onSave={(sig) => handleChange('firmas', 'representante', sig)}
                    initialImage={formData.firmas.representante}
                    label="Firma Representante Empresa" />
                  
                    </div>
                    
                    <div className="card p-[1rem] bg-[rgba(var(--color-surface-rgb),_0.3)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)]">
                        <SignatureCanvas
                    onSave={(sig) => handleChange('firmas', 'profesional', sig)}
                    initialImage={formData.firmas.profesional}
                    label="Firma Profesional H&S" />
                  
                    </div>
                </div>
            </div>
          </div>
          }

        {/* ═══ AMBIENTE TAB ═══ */}
        {activeTab === 'ambiente' &&
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-11 h-11 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl flex items-center justify-center shadow-[0_4px_15px_rgba(13,148,136,0.3)]">
                  <Wind size={22} color="#fff" />
              </div>
              <div>
                  <h2 className="m-0 text-xl font-extrabold text-slate-800 dark:text-slate-100">Estudios de Medio Ambiente</h2>
                  <p className="m-0 text-sm text-slate-500 dark:text-slate-400">Resolución 905/15</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Iluminación */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Medición de Iluminación (Res 84/12)</label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm">¿Apto s/Ley?</span>
                    <select
                      value={formData.ambiente.iluminacionApto ? "si" : "no"}
                      onChange={(e) => handleChange('ambiente', 'iluminacionApto', e.target.value === 'si')}
                      className="p-1 text-sm border border-slate-300 rounded">
                      
                      <option value="si">SÍ, CUMPLE</option>
                      <option value="no">NO CUMPLE</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">Fecha de Medición</label>
                  <input
                    type="date"
                    value={formData.ambiente.iluminacionFecha}
                    onChange={(e) => handleChange('ambiente', 'iluminacionFecha', e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg" />
                  
                </div>
              </div>

              {/* Ruido */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Medición de Ruido (Res 85/12)</label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm">¿Apto s/Ley?</span>
                    <select
                      value={formData.ambiente.ruidoApto ? "si" : "no"}
                      onChange={(e) => handleChange('ambiente', 'ruidoApto', e.target.value === 'si')}
                      className="p-1 text-sm border border-slate-300 rounded">
                      
                      <option value="si">SÍ, CUMPLE</option>
                      <option value="no">NO CUMPLE</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">Fecha de Medición</label>
                  <input
                    type="date"
                    value={formData.ambiente.ruidoFecha}
                    onChange={(e) => handleChange('ambiente', 'ruidoFecha', e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg" />
                  
                </div>
              </div>

               {/* PAT */}
               <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Puesta a Tierra (Res 900/15)</label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm">¿Apto s/Ley?</span>
                    <select
                      value={formData.ambiente.puestaTierraApto ? "si" : "no"}
                      onChange={(e) => handleChange('ambiente', 'puestaTierraApto', e.target.value === 'si')}
                      className="p-1 text-sm border border-slate-300 rounded">
                      
                      <option value="si">SÍ, CUMPLE</option>
                      <option value="no">NO CUMPLE</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">Fecha de Medición</label>
                  <input
                    type="date"
                    value={formData.ambiente.puestaTierraFecha}
                    onChange={(e) => handleChange('ambiente', 'puestaTierraFecha', e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg" />
                  
                </div>
              </div>

              {/* Estrés Térmico */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Estrés Térmico (Res 295/03)</label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm">¿Apto s/Ley?</span>
                    <select
                      value={formData.ambiente.estresTermicoApto ? "si" : "no"}
                      onChange={(e) => handleChange('ambiente', 'estresTermicoApto', e.target.value === 'si')}
                      className="p-1 text-sm border border-slate-300 rounded">
                      
                      <option value="si">SÍ, CUMPLE</option>
                      <option value="no">NO CUMPLE</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">Fecha de Medición</label>
                  <input
                    type="date"
                    value={formData.ambiente.estresTermicoFecha}
                    onChange={(e) => handleChange('ambiente', 'estresTermicoFecha', e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg" />
                  
                </div>
              </div>

              {/* Ventilación */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Ventilación (Cap. 11 Dec 351/79)</label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm">¿Apto s/Ley?</span>
                    <select
                      value={formData.ambiente.ventilacionApto ? "si" : "no"}
                      onChange={(e) => handleChange('ambiente', 'ventilacionApto', e.target.value === 'si')}
                      className="p-1 text-sm border border-slate-300 rounded">
                      
                      <option value="si">SÍ, CUMPLE</option>
                      <option value="no">NO CUMPLE</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">Fecha de Medición</label>
                  <input
                    type="date"
                    value={formData.ambiente.ventilacionFecha}
                    onChange={(e) => handleChange('ambiente', 'ventilacionFecha', e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg" />
                  
                </div>
              </div>

              {/* Contaminantes Químicos */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Contaminantes Químicos (Res 295/03)</label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm">¿Apto s/Ley?</span>
                    <select
                      value={formData.ambiente.contaminantesApto ? "si" : "no"}
                      onChange={(e) => handleChange('ambiente', 'contaminantesApto', e.target.value === 'si')}
                      className="p-1 text-sm border border-slate-300 rounded">
                      
                      <option value="si">SÍ, CUMPLE</option>
                      <option value="no">NO CUMPLE</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">Fecha de Medición</label>
                  <input
                    type="date"
                    value={formData.ambiente.contaminantesFecha}
                    onChange={(e) => handleChange('ambiente', 'contaminantesFecha', e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg" />
                  
                </div>
              </div>

            </div>
            <AdjuntosSection
              adjuntos={formData.ambiente.adjuntos || []}
              onAdd={(b64) => addAdjunto('ambiente', b64)}
              onRemove={(i) => removeAdjunto('ambiente', i)}
              accentColor="#0d9488" />
            
          </div>
          }
      </div>

      </main>
      <div className="no-print floating-action-bar">
          {id &&
        <button
          onClick={handleGeneratePDF}
          className="btn-floating-action bg-orange-500 hover:bg-orange-600 text-white">
          
                <Printer size={18} /> IMPRIMIR PDF
            </button>
        }
          <button
          onClick={(e) => {e.preventDefault();requirePro(handleSave);}}
          className="btn-floating-action bg-emerald-500 hover:bg-emerald-600 text-white">
          
              <Save size={18} /> GUARDAR LEGAJO
          </button>
      </div>
    </div>);

}