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
  CheckCircle2
} from 'lucide-react';
import LegajoPdf from '../components/LegajoPdf';

const TABS = [
  { id: 'empresa', label: 'Empresa', icon: Building2, color: '#2563eb' },
  { id: 'riesgos', label: 'Riesgos', icon: AlertTriangle, color: '#dc2626' },
  { id: 'incendio', label: 'Incendio', icon: Flame, color: '#ea580c' },
  { id: 'epp', label: 'EPP', icon: ShieldCheck, color: '#16a34a' },
  { id: 'ambiente', label: 'Ambiente', icon: Wind, color: '#0d9488' },
  { id: 'firmas', label: 'Firmas', icon: PenTool, color: '#7c3aed' },
];

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
    fechaInicioActividad: ''
  },
  riesgos: {
    fisicos: '',
    quimicos: '',
    biologicos: '',
    ergonomicos: '',
    electricos: '',
    trabajoAltura: '',
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
    iluminacionFecha: '',
    iluminacionApto: true,
    ruidoFecha: '',
    ruidoApto: true,
    puestaTierraFecha: '',
    puestaTierraApto: true,
    estresTermicoFecha: '',
    estresTermicoApto: true,
    ventilacionFecha: '',
    ventilacionApto: true,
    contaminantesFecha: '',
    contaminantesApto: true,
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
}: {
  adjuntos: string[];
  onAdd: (base64: string) => void;
  onRemove: (index: number) => void;
  accentColor?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
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
    <div style={{ marginTop: '1.25rem' }}>
      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
        Archivos Adjuntos
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: accentColor + '14',
          color: accentColor,
          border: `1px solid ${accentColor}44`,
          borderRadius: '0.75rem',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.85rem'
        }}
      >
        <Camera size={16} /> Adjuntar Foto/Documento
      </button>
      {adjuntos.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem' }}>
          {adjuntos.map((src, idx) => (
            <div key={idx} style={{ position: 'relative', width: 96, height: 96 }}>
              <img
                src={src}
                alt={`adjunto-${idx}`}
                style={{
                  width: 96,
                  height: 96,
                  objectFit: 'cover',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0'
                }}
              />
              <button
                type="button"
                onClick={() => onRemove(idx)}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
  return total === 0 ? 0 : Math.round((filled / total) * 100);
}

export default function LegajoForm() {
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
    if (id && currentUser) {
      loadLegajo(id);
    }
  }, [id, currentUser]);

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
      const docRef = id 
        ? doc(db, 'users', currentUser.uid, 'legajos', id)
        : doc(collection(db, 'users', currentUser.uid, 'legajos'));
      
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
      navigate('/subscription');
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
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  /* helpers for adjuntos */
  const addAdjunto = (section: 'riesgos' | 'incendio' | 'epp' | 'ambiente', base64: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        adjuntos: [...(prev[section].adjuntos || []), base64]
      }
    }));
  };

  const removeAdjunto = (section: 'riesgos' | 'incendio' | 'epp' | 'ambiente', index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        adjuntos: (prev[section].adjuntos || []).filter((_: any, i: number) => i !== index)
      }
    }));
  };

  if (loading) return <div className="text-center p-12 pt-32">Cargando datos del legajo...</div>;

  const inputStyle = { background: "var(--color-surface)", border: "1px solid var(--color-border)" };

  return (
    <div className="pt-24 pb-20" style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <div className="print-only" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <div id="pdf-content">
              <LegajoPdf data={{ ...formData, professionalName: currentUser?.displayName || 'Profesional H&S' }} />
          </div>
      </div>
      <div style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: '1rem 1.5rem',
          position: 'sticky',
          top: '5.5rem',
          zIndex: 100,
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
      }}>
          <button
              onClick={() => navigate('/legajos')}
              style={{
                  padding: '0.5rem',
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  color: 'var(--color-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
              }}
          >
              <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900 }}>
                  {id ? 'Editar Legajo Técnico' : 'Nuevo Legajo Técnico'}
              </h1>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Decreto 351/79</p>
          </div>
      </div>

      <main style={{ padding: '2rem 1.5rem', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ═══ Tabs ═══ */}
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        gap: '0.4rem',
        background: '#ffffff',
        padding: '0.5rem',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const sectionData = (formData as any)[tab.id];
          const progress = sectionData ? calcTabProgress(sectionData) : 0;
          const statusIcon = progress === 100 ? '✅' : progress > 0 ? '⚠️' : '';

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem',
                padding: '0.6rem 0.75rem',
                borderRadius: '0.5rem',
                fontWeight: 600,
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                flex: 1,
                cursor: 'pointer',
                border: isActive ? `1px solid ${tab.color}33` : '1px solid transparent',
                background: isActive ? tab.color + '18' : 'transparent',
                color: isActive ? tab.color : '#64748b',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Icon style={{ width: 18, height: 18, color: isActive ? tab.color : '#94a3b8' }} />
                <span>{tab.label}</span>
                {statusIcon && <span style={{ fontSize: '0.7rem' }}>{statusIcon}</span>}
              </div>
              {/* Progress bar */}
              <div style={{
                width: '100%',
                height: 3,
                borderRadius: 2,
                background: '#e2e8f0',
                overflow: 'hidden',
                marginTop: 2
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: tab.color,
                  borderRadius: 2,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* ═══ Forms Area ═══ */}
      <div className="card" style={{ padding: "2rem", background: "var(--gradient-card)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-2xl)", boxShadow: "var(--glass-shadow)" }}>
        
        {/* ═══ EMPRESA TAB ═══ */}
        {activeTab === 'empresa' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Datos del Establecimiento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Razón Social</label>
                <input 
                  type="text" 
                  value={formData.empresa.razonSocial}
                  onChange={e => handleChange('empresa', 'razonSocial', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Ej: Metalúrgica San Martín S.A."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CUIT</label>
                <input 
                  type="text" 
                  value={formData.empresa.cuit}
                  onChange={e => handleChange('empresa', 'cuit', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="30-12345678-9"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Domicilio Completo</label>
                <input 
                  type="text" 
                  value={formData.empresa.domicilio}
                  onChange={e => handleChange('empresa', 'domicilio', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Calle, Número, Piso, Dpto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Localidad</label>
                <input 
                  type="text" 
                  value={formData.empresa.localidad}
                  onChange={e => handleChange('empresa', 'localidad', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provincia</label>
                <input 
                  type="text" 
                  value={formData.empresa.provincia}
                  onChange={e => handleChange('empresa', 'provincia', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Ej: Buenos Aires"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código Postal</label>
                <input 
                  type="text" 
                  value={formData.empresa.codigoPostal}
                  onChange={e => handleChange('empresa', 'codigoPostal', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Ej: B1636"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input 
                  type="tel" 
                  value={formData.empresa.telefono}
                  onChange={e => handleChange('empresa', 'telefono', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Ej: 011 4555-1234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={formData.empresa.email}
                  onChange={e => handleChange('empresa', 'email', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="contacto@empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Actividad Principal</label>
                <input 
                  type="text" 
                  value={formData.empresa.actividad}
                  onChange={e => handleChange('empresa', 'actividad', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Aseguradora (ART)</label>
                <input 
                  type="text" 
                  value={formData.empresa.art}
                  onChange={e => handleChange('empresa', 'art', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Póliza ART</label>
                <input 
                  type="text" 
                  value={formData.empresa.polizaArt}
                  onChange={e => handleChange('empresa', 'polizaArt', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Nro. de póliza"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad de Empleados</label>
                <input 
                  type="number" 
                  value={formData.empresa.cantidadEmpleados}
                  onChange={e => handleChange('empresa', 'cantidadEmpleados', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Superficie (m²)</label>
                <input 
                  type="number" 
                  value={formData.empresa.superficie}
                  onChange={e => handleChange('empresa', 'superficie', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Responsable de Seguridad</label>
                <input 
                  type="text" 
                  value={formData.empresa.responsableSeguridad}
                  onChange={e => handleChange('empresa', 'responsableSeguridad', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Nombre y apellido"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula del Responsable</label>
                <input 
                  type="text" 
                  value={formData.empresa.matriculaResponsable}
                  onChange={e => handleChange('empresa', 'matriculaResponsable', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Representante Legal</label>
                <input 
                  type="text" 
                  value={formData.empresa.representanteLegal}
                  onChange={e => handleChange('empresa', 'representanteLegal', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Horarios de Trabajo</label>
                <input 
                  type="text" 
                  value={formData.empresa.horariosTrabajo}
                  onChange={e => handleChange('empresa', 'horariosTrabajo', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Ej: Lunes a Viernes 8 a 17hs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio de Actividad</label>
                <input 
                  type="date" 
                  value={formData.empresa.fechaInicioActividad}
                  onChange={e => handleChange('empresa', 'fechaInicioActividad', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══ RIESGOS TAB ═══ */}
        {activeTab === 'riesgos' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Identificación de Riesgos</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Riesgos Físicos presentes</label>
                <textarea 
                  rows={3}
                  value={formData.riesgos.fisicos}
                  onChange={e => handleChange('riesgos', 'fisicos', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Ej: Ruido continuo en sector producción, carga térmica en hornos..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Riesgos Químicos / Riesgo Ambiental</label>
                <textarea 
                  rows={3}
                  value={formData.riesgos.quimicos}
                  onChange={e => handleChange('riesgos', 'quimicos', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Sustancias utilizadas, vapores, material particulado..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Riesgos Biológicos</label>
                <textarea 
                  rows={3}
                  value={formData.riesgos.biologicos}
                  onChange={e => handleChange('riesgos', 'biologicos', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Contacto con agentes biológicos, residuos patogénicos..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Riesgos Ergonómicos</label>
                <textarea 
                  rows={3}
                  value={formData.riesgos.ergonomicos}
                  onChange={e => handleChange('riesgos', 'ergonomicos', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Posturas forzadas, movimientos repetitivos, levantamiento manual de cargas..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Riesgos Eléctricos</label>
                <textarea 
                  rows={3}
                  value={formData.riesgos.electricos}
                  onChange={e => handleChange('riesgos', 'electricos', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Contacto directo/indirecto, tableros sin protección..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Trabajo en Altura</label>
                <textarea 
                  rows={3}
                  value={formData.riesgos.trabajoAltura}
                  onChange={e => handleChange('riesgos', 'trabajoAltura', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Escaleras, andamios, techos, niveles superiores..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Medidas Preventivas Generales Adoptadas</label>
                <textarea 
                  rows={4}
                  value={formData.riesgos.medidasPreventivas}
                  onChange={e => handleChange('riesgos', 'medidasPreventivas', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Ej: Sistema de extracción localizada instalada. Guardas de seguridad mecánicas..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nivel de Riesgo General</label>
                <select
                  value={formData.riesgos.nivelRiesgo}
                  onChange={e => handleChange('riesgos', 'nivelRiesgo', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                >
                  <option value="">Seleccione...</option>
                  <option value="Bajo">Bajo</option>
                  <option value="Medio">Medio</option>
                  <option value="Alto">Alto</option>
                  <option value="Crítico">Crítico</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                <textarea 
                  rows={4}
                  value={formData.riesgos.observaciones}
                  onChange={e => handleChange('riesgos', 'observaciones', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Observaciones adicionales sobre los riesgos identificados..."
                />
              </div>
            </div>
            <AdjuntosSection
              adjuntos={formData.riesgos.adjuntos || []}
              onAdd={(b64) => addAdjunto('riesgos', b64)}
              onRemove={(i) => removeAdjunto('riesgos', i)}
              accentColor="#dc2626"
            />
          </div>
        )}

        {/* ═══ INCENDIO TAB ═══ */}
        {activeTab === 'incendio' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Protección Contra Incendios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Carga de Fuego Calculada (Mcal/m²)</label>
                <input 
                  type="text" 
                  value={formData.incendio.cargaFuego}
                  onChange={e => handleChange('incendio', 'cargaFuego', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Riesgo de Incendio (R1 a R7)</label>
                <select 
                  value={formData.incendio.riesgoIncendio}
                  onChange={e => handleChange('incendio', 'riesgoIncendio', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                >
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
                  onChange={e => handleChange('incendio', 'cantidadExtintores', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Extintores</label>
                <input 
                  type="text" 
                  value={formData.incendio.tipoExtintores}
                  onChange={e => handleChange('incendio', 'tipoExtintores', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Ej: ABC, CO2, Agua"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Último Simulacro</label>
                <input 
                  type="date" 
                  value={formData.incendio.fechaSimulacro}
                  onChange={e => handleChange('incendio', 'fechaSimulacro', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <p className="block text-sm font-medium text-slate-700 mb-3">Sistemas de Protección</p>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.incendio.planEvacuacion} onChange={e => handleChange('incendio', 'planEvacuacion', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Plan de Evacuación</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.incendio.sistemaDeteccion} onChange={e => handleChange('incendio', 'sistemaDeteccion', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Sistema de Detección</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.incendio.redHidrantes} onChange={e => handleChange('incendio', 'redHidrantes', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Red de Hidrantes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.incendio.brigadaEmergencia} onChange={e => handleChange('incendio', 'brigadaEmergencia', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Brigada de Emergencia</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.incendio.planoEvacuacion} onChange={e => handleChange('incendio', 'planoEvacuacion', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Plano de Evacuación</span>
                </label>
              </div>
            </div>
            <AdjuntosSection
              adjuntos={formData.incendio.adjuntos || []}
              onAdd={(b64) => addAdjunto('incendio', b64)}
              onRemove={(i) => removeAdjunto('incendio', i)}
              accentColor="#ea580c"
            />
          </div>
        )}

        {/* ═══ EPP TAB ═══ */}
        {activeTab === 'epp' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">EPP y Capacitaciones</h2>
            
            <div>
              <p className="block text-sm font-medium text-slate-700 mb-3">Elementos de Protección Personal (Res 299/11)</p>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.ropaTrabajo} onChange={e => handleChange('epp', 'ropaTrabajo', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Ropa de Trabajo</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.calzadoSeguridad} onChange={e => handleChange('epp', 'calzadoSeguridad', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Calzado de Seguridad</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.proteccionOcular} onChange={e => handleChange('epp', 'proteccionOcular', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Protección Ocular</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.proteccionAuditiva} onChange={e => handleChange('epp', 'proteccionAuditiva', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Protección Auditiva</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.proteccionRespiratoria} onChange={e => handleChange('epp', 'proteccionRespiratoria', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Protección Respiratoria</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.cascoSeguridad} onChange={e => handleChange('epp', 'cascoSeguridad', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Casco de Seguridad</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.guantesSeguridad} onChange={e => handleChange('epp', 'guantesSeguridad', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Guantes de Seguridad</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.arnesSeguridad} onChange={e => handleChange('epp', 'arnesSeguridad', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Arnés de Seguridad</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.proteccionFacial} onChange={e => handleChange('epp', 'proteccionFacial', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Protección Facial</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.epp.chalecoReflectivo} onChange={e => handleChange('epp', 'chalecoReflectivo', e.target.checked)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Chaleco Reflectivo</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Última Capacitación General (Tema y Fecha)</label>
                <textarea 
                  rows={2}
                  value={formData.epp.capacitacionRealizada}
                  onChange={e => handleChange('epp', 'capacitacionRealizada', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Uso de extintores - 15/05/2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Próxima Capacitación Programada</label>
                <textarea 
                  rows={2}
                  value={formData.epp.proximaCapacitacion}
                  onChange={e => handleChange('epp', 'proximaCapacitacion', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Riesgo Eléctrico - Octubre 2024"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Plan Anual de Capacitación</label>
                <textarea 
                  rows={4}
                  value={formData.epp.planAnualCapacitacion}
                  onChange={e => handleChange('epp', 'planAnualCapacitacion', e.target.value)}
                  className="toolbox-input-plain" style={inputStyle}
                  placeholder="Detalle del plan anual de capacitación en seguridad e higiene..."
                />
              </div>
            </div>
            <AdjuntosSection
              adjuntos={formData.epp.adjuntos || []}
              onAdd={(b64) => addAdjunto('epp', b64)}
              onRemove={(i) => removeAdjunto('epp', i)}
              accentColor="#16a34a"
            />
          </div>
        )}


        {/* ═══ FIRMAS TAB ═══ */}
        {activeTab === 'firmas' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Firmas del Documento</h2>
            
            <div style={{ marginBottom: '2.5rem' }}>
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
                  box3={null}
              />
            </div>

            <div className="no-print animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    <div className="card" style={{ padding: '1rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)' }}>
                        <SignatureCanvas 
                            onSave={(sig) => handleChange('firmas', 'representante', sig)}
                            initialImage={formData.firmas.representante}
                            label="Firma Representante Empresa"
                        />
                    </div>
                    
                    <div className="card" style={{ padding: '1rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)' }}>
                        <SignatureCanvas 
                            onSave={(sig) => handleChange('firmas', 'profesional', sig)}
                            initialImage={formData.firmas.profesional}
                            label="Firma Profesional H&S"
                        />
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* ═══ AMBIENTE TAB ═══ */}
        {activeTab === 'ambiente' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Estudios de Medio Ambiente (Res 905/15)</h2>
            
            <div className="space-y-4">
              {/* Iluminación */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Medición de Iluminación (Res 84/12)</label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm">¿Apto s/Ley?</span>
                    <select 
                      value={formData.ambiente.iluminacionApto ? "si" : "no"}
                      onChange={e => handleChange('ambiente', 'iluminacionApto', e.target.value === 'si')}
                      className="p-1 text-sm border border-slate-300 rounded"
                    >
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
                    onChange={e => handleChange('ambiente', 'iluminacionFecha', e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg"
                  />
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
                      onChange={e => handleChange('ambiente', 'ruidoApto', e.target.value === 'si')}
                      className="p-1 text-sm border border-slate-300 rounded"
                    >
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
                    onChange={e => handleChange('ambiente', 'ruidoFecha', e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg"
                  />
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
                      onChange={e => handleChange('ambiente', 'puestaTierraApto', e.target.value === 'si')}
                      className="p-1 text-sm border border-slate-300 rounded"
                    >
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
                    onChange={e => handleChange('ambiente', 'puestaTierraFecha', e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg"
                  />
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
                      onChange={e => handleChange('ambiente', 'estresTermicoApto', e.target.value === 'si')}
                      className="p-1 text-sm border border-slate-300 rounded"
                    >
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
                    onChange={e => handleChange('ambiente', 'estresTermicoFecha', e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg"
                  />
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
                      onChange={e => handleChange('ambiente', 'ventilacionApto', e.target.value === 'si')}
                      className="p-1 text-sm border border-slate-300 rounded"
                    >
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
                    onChange={e => handleChange('ambiente', 'ventilacionFecha', e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg"
                  />
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
                      onChange={e => handleChange('ambiente', 'contaminantesApto', e.target.value === 'si')}
                      className="p-1 text-sm border border-slate-300 rounded"
                    >
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
                    onChange={e => handleChange('ambiente', 'contaminantesFecha', e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

            </div>
            <AdjuntosSection
              adjuntos={formData.ambiente.adjuntos || []}
              onAdd={(b64) => addAdjunto('ambiente', b64)}
              onRemove={(i) => removeAdjunto('ambiente', i)}
              accentColor="#0d9488"
            />
          </div>
        )}
      </div>

      </main>
      <div className="no-print floating-action-bar">
          {id && (
            <button
                onClick={handleGeneratePDF}
                className="btn-floating-action"
                style={{ background: '#FF8B00', color: '#ffffff' }}
            >
                <Printer size={18} /> IMPRIMIR PDF
            </button>
          )}
          <button
              onClick={handleSave}
              className="btn-floating-action"
              style={{ background: '#36B37E', color: '#ffffff' }}
          >
              <Save size={18} /> GUARDAR LEGAJO
          </button>
      </div>
    </div>
  );
}
