import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, ArrowDown, Shield, AlertTriangle, Clock, CheckCircle2, XCircle, X, User, MapPin, Ruler, Eye, Printer, Share2, Pencil, HardHat } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import WorkingAtHeightPdf from '../components/WorkingAtHeightPdf';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { ModuleFormSection, ModuleActionBar } from '../components/module';

const WORK_TYPES = [
{ id: 'scaffolding', name: 'Andamios', icon: '🏗️' },
{ id: 'ladder', name: 'Escalera', icon: '🪜' },
{ id: 'roof', name: 'Techos', icon: '🏠' },
{ id: 'platform', name: 'Plataforma', icon: '📦' },
{ id: 'lift', name: 'Elevador', icon: '⬆️' },
{ id: 'structure', name: 'Estructura', icon: '🔩' }];


const PRIORITY = {
  critical: { label: 'CRÍTICA', color: '#dc2626', icon: '🚨' },
  high: { label: 'ALTA', color: '#f59e0b', icon: '⚠️' },
  medium: { label: 'MEDIA', color: '#3b82f6', icon: 'ℹ️' },
  low: { label: 'BAJA', color: '#16a34a', icon: '✅' }
};

export default function WorkingAtHeightForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const { isPro } = usePaywall();

  useDocumentTitle(isEdit ? 'Editar Permiso en Altura' : 'Permiso de Trabajo en Altura');

  const [permit, setPermit] = useState<any>({
    workerName: '',
    workType: 'scaffolding',
    location: '',
    height: '',
    priority: 'medium',
    supervisor: '',
    observations: '',
    medicalFitness: false,
    rescuePlan: '',
    equipmentCheck: {
      harness: 'good',
      lanyard: 'good',
      anchor: 'good'
    },
    ppe: {
      harness: true,
      lanyard: true,
      helmet: true,
      lifeline: false
    },
    signature: '',
    operatorSignature: '',
    professionalSignature: '',
    supervisorSignature: '',
    showSignatures: { operator: true, professional: true, supervisor: true }
  });

  const [professional, setProfessional] = useState<any>({
    name: '',
    license: '',
    signature: null,
    stamp: null
  });

  const setShowSignatures = (updater: any) => {
    setPermit((prev: any) => {
      const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
      return { ...prev, showSignatures: updated };
    });
  };

  const showSignatures = permit.showSignatures || { operator: true, professional: true, supervisor: true };

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (location.state?.editData) {
      const editData = location.state.editData;
      setPermit({
        ...editData,
        operatorSignature: editData.operatorSignature || '',
        professionalSignature: editData.professionalSignature || '',
        supervisorSignature: editData.supervisorSignature || editData.signature || '',
        signature: editData.signature || editData.supervisorSignature || '',
        showSignatures: editData.showSignatures || { operator: true, professional: true, supervisor: true }
      });
      setIsEdit(true);
    }
  }, [location.state]);


  useEffect(() => {
    window.scrollTo(0, 0);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSave = () => {
    if (!permit.workerName || !permit.height) {
      toast.error('Por favor complete los campos obligatorios (*)');
      return;
    }

    const saved = JSON.parse(localStorage.getItem('working_height_permits_db') || '[]');
    let updated;

    const permitWithSignatures = {
      ...permit,
      professionalSignature: permit.professionalSignature || professional.signature,
      professionalName: permit.professionalName || professional.name,
      professionalLicense: permit.professionalLicense || professional.license,
      professionalStamp: permit.professionalStamp || professional.stamp
    };

    if (isEdit) {
      updated = saved.map((p: any) => p.id === (permit as any).id ? permitWithSignatures : p);
      toast.success('Permiso actualizado');
    } else {
      const newPermit = {
        ...permitWithSignatures,
        id: `WAH-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      updated = [newPermit, ...saved];
      toast.success('Permiso guardado');
    }

    localStorage.setItem('working_height_permits_db', JSON.stringify(updated));

    if (isEdit && (permit as any).status === 'active') {
      const activeSaved = JSON.parse(localStorage.getItem('working_height_active_db') || '[]');
      const updatedActive = activeSaved.map((p: any) => p.id === (permit as any).id ? permitWithSignatures : p);
      localStorage.setItem('working_height_active_db', JSON.stringify(updatedActive));
    }

    navigate('/working-at-height');
  };


  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--color-text-muted)'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-background)',
    color: 'var(--color-text)',
    fontSize: '1rem',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none'
  } as any;

  return (
    <AnimatedPage>
      <div className="container pb-[8rem] space-y-6 min-h-[100vh]">
        {/* Header Principal Banner */}
        <PremiumHeader
          title={isEdit ? 'Editar Permiso en Altura' : 'Permiso de Trabajo en Altura'}
          subtitle="Gestión de permisos según OSHA 1926.501 • Res. SRT 61/23"
          icon={<HardHat size={32} color="#ffffff" />}
          color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
          onBack={() => navigate('/working-at-height')}
        />

        {/* Botón Volver al Historial */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/working-at-height')}
            style={{ backgroundColor: '#475569', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} /> Volver al Historial
          </button>
        </div>

        {/* Tarjeta Principal del Formulario */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8">
          <ModuleFormSection title="Información General" icon={<User size={20} />}>
                    <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[1.5rem]">
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Nombre del Trabajador *</label>
                            <input type="text" value={permit.workerName} onChange={(e) => setPermit({ ...permit, workerName: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="Nombre completo" />
                        </div>
                        <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Tipo de Trabajo</label>
                            <div style={{ gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)' }} className="grid gap-[1rem]">
                                {WORK_TYPES.map((t) =>
                <button
                  key={t.id}
                  onClick={() => setPermit({ ...permit, workType: t.id })}
                  style={{
                    background: permit.workType === t.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-background)',
                    border: `2px solid ${permit.workType === t.id ? 'var(--color-primary)' : 'var(--color-border)'}`
                  }} className="p-[1rem] rounded-[var(--radius-xl)] cursor-pointer flex flex-col items-center gap-[0.5rem] transition-[all_0.2s]">
                  
                                        <span className="text-[2rem]">{t.icon}</span>
                                        <span style={{ color: permit.workType === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)' }} className="text-[0.8rem] font-[800]">{t.name}</span>
                                    </button>
                )}
                            </div>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Altura estimada (metros) *</label>
                            <div className="relative">
                                <input type="number" step="0.1" value={permit.height} onChange={(e) => setPermit({ ...permit, height: e.target.value })} style={{ ...inputStyle }} placeholder="Ej: 3.5" className="pr-[2.5rem]" />
                                <span className="absolute right-[1rem] top-[50%] transform-[translateY(-50%)] font-[700] text-[var(--color-text-muted)]">m</span>
                            </div>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Ubicación</label>
                            <input type="text" value={permit.location} onChange={(e) => setPermit({ ...permit, location: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="Ej: Sector B - Nivel 4" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Supervisor a Cargo</label>
                            <input type="text" value={permit.supervisor} onChange={(e) => setPermit({ ...permit, supervisor: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="Nombre del supervisor" />
                        </div>
                        <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Prioridad / Riesgo</label>
                            <div style={{ gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)' }} className="grid gap-[1rem]">
                                {Object.entries(PRIORITY).map(([k, v]) =>
                <button
                  key={k}
                  onClick={() => setPermit({ ...permit, priority: k })}
                  style={{
                    background: permit.priority === k ? `${v.color}15` : 'var(--color-background)',
                    border: `2px solid ${permit.priority === k ? v.color : 'var(--color-border)'}`,
                    color: permit.priority === k ? v.color : 'var(--color-text-muted)',
                    boxShadow: permit.priority === k ? `0 0 15px ${v.color}30` : 'none'
                  }} className="p-[1rem] rounded-[var(--radius-xl)] cursor-pointer flex items-center justify-center gap-[0.5rem] font-[800] transition-[all_0.2s]">
                  
                                        <span className="text-[1.2rem]">{v.icon}</span>
                                        {v.label}
                                    </button>
                )}
                            </div>
                        </div>
                    </div>
                    </ModuleFormSection>

                    <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="mt-[2.5rem] grid gap-[2rem]">
                        <ModuleFormSection title="Validación Legal (Res. SRT 61/23)" icon={<Shield size={20} />}>
                            
                            <div className="flex flex-col gap-4">
                                <div style={{
                  background: permit.medicalFitness ? '#dcfce7' : '#fff5f5',
                  border: `2px solid ${permit.medicalFitness ? '#16a34a' : '#ef4444'}`
                }} className="p-[1.5rem] rounded-[var(--radius-xl)] flex flex-col gap-[1rem]">
                                    <div className="flex items-center gap-4">
                                        <button
                      type="button"
                      onClick={() => setPermit({ ...permit, medicalFitness: !permit.medicalFitness })}
                      style={{
                        backgroundColor: permit.medicalFitness ? '#16a34a' : '#ef4444'
                      }} className="w-[40px] h-[40px] rounded-[50%] flex items-center justify-center cursor-pointer transition-all flex-shrink-0 border-none shadow-md">
                      
                                            {permit.medicalFitness ? <CheckCircle2 size={24} color="#fff" /> : <XCircle size={24} color="#fff" />}
                                        </button>
                                        <div>
                                            <span style={{ color: permit.medicalFitness ? '#15803d' : '#991b1b' }} className="text-[1.1rem] font-[900] block">
                                                Apto Médico Vigente: {permit.medicalFitness ? '✓ HABILITADO' : '✕ NO HABILITADO'}
                                            </span>
                                            <span style={{ color: permit.medicalFitness ? '#166534' : '#b91c1c' }} className="text-[0.8rem] font-[700]">
                                                {permit.medicalFitness ? 'Verificado y habilitado para tareas en altura' : '¡ATENCIÓN! No puede realizar tareas sin apto médico'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-slate-400">Plan de Rescate (Resumen)</label>
                                    <textarea
                    value={permit.rescuePlan}
                    onChange={(e) => setPermit({ ...permit, rescuePlan: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors min-h-[80px]"
                    placeholder="Describa brevemente el método de rescate previsto..." />
                  
                                </div>
                            </div>
                        </ModuleFormSection>

                        <ModuleFormSection title="Inspección de Equipos" icon={<Ruler size={20} />}>
                            {Object.entries(permit.equipmentCheck).map(([key, value]) =>
              <div key={key} className="mb-[1rem]">
                                    <label className="block mb-2 text-sm font-semibold text-slate-400">{key === 'harness' ? 'Arnés' : key === 'lanyard' ? 'Cola de Amarre' : 'Punto de Anclaje'}</label>
                                    <div className="flex gap-[0.5rem]">
                                        {[
                                          { id: 'good', label: '✓ Bueno', bg: '#16a34a' },
                                          { id: 'bad', label: '✕ Malo', bg: '#dc2626' },
                                          { id: 'na', label: '— N/A', bg: '#475569' }
                                        ].map((st) =>
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setPermit({ ...permit, equipmentCheck: { ...permit.equipmentCheck, [key]: st.id } })}
                    style={{
                      background: value === st.id ? st.bg : 'var(--color-surface)',
                      color: value === st.id ? 'white' : 'var(--color-text)',
                      border: value === st.id ? `2px solid ${st.bg}` : '1px solid var(--color-border)',
                      fontWeight: value === st.id ? '900' : '600'
                    }} className="flex-1 p-[0.6rem] text-[0.85rem] rounded-[var(--radius-md)] cursor-pointer transition-all">
                    {st.label}
                  </button>
                  )}
                                    </div>
                                </div>
              )}
                        </ModuleFormSection>
                    </div>

                    <div className="mt-[2.5rem]">
                        <ModuleFormSection title="Equipos de Protección Personal (EPP)" icon={<Shield size={20} />}>
                        <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[1rem]">
                            {Object.entries(permit.ppe).map(([key, value]) =>
              <button
                key={key}
                type="button"
                onClick={() => setPermit({ ...permit, ppe: { ...permit.ppe, [key]: !value } })}
                style={{
                  background: value ? '#dcfce7' : '#fff5f5',
                  border: `2px solid ${value ? '#16a34a' : '#fca5a5'}`
                }} className="p-[1rem] rounded-[var(--radius-lg)] cursor-pointer flex items-center justify-between transition-all">
                
                                    <div className="flex items-center gap-[0.75rem]">
                                      <div style={{ background: value ? '#16a34a' : '#ef4444' }} className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center font-black text-white text-xs">
                                          {value ? '✓' : '✕'}
                                      </div>
                                      <span style={{ color: value ? '#15803d' : '#991b1b' }} className="text-[0.9rem] font-[800] capitalize">
                                          {key === 'harness' && 'Arnés de Seguridad'}
                                          {key === 'lanyard' && 'Cola de Amarre'}
                                          {key === 'helmet' && 'Casco con Barbijo'}
                                          {key === 'lifeline' && 'Línea de Vida'}
                                      </span>
                                    </div>
                                    <span style={{ backgroundColor: value ? '#16a34a' : '#ef4444' }} className="text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                                      {value ? 'REQUERIDO' : 'NO REQUERIDO'}
                                    </span>
                                </button>
              )}
                        </div>
                        </ModuleFormSection>
                    </div>

                    <div className="mt-[2.5rem]">
                        <ModuleFormSection title="Observaciones Adicionales" icon={<AlertTriangle size={20} />}>
                        <textarea
              value={permit.observations}
              onChange={(e) => setPermit({ ...permit, observations: e.target.value })}
              style={{ ...inputStyle }}
              placeholder="Describa cualquier detalle relevante del trabajo o riesgos específicos..." className="min-h-[80px] pt-[0.75rem]" />
            
                        </ModuleFormSection>
                    </div>

                    {/* Firmas y Autorizaciones */}
                    <div className="mt-[2.5rem]">
                        <ModuleFormSection title="Firmas y Autorizaciones del Permiso" icon={<Pencil size={20} />}>

                        {/* 1. Recuadros Interáctivos para Dibujar Firmas en Pantalla */}
                        <div className="no-print mb-8 p-6 bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-200 dark:border-slate-700 rounded-3xl space-y-4 shadow-sm">
                          <h3 className="m-0 text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <span>🖊️</span> FIRMAS DIGITALES (DIBUJAR EN PANTALLA)
                          </h3>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 m-0 mb-4">
                            Dibuje las firmas sobre los recuadros táctiles. Aparecerán automáticamente en la planilla oficial.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
                              <SignatureCanvas
                                onSave={(sig) => setPermit((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                                initialImage={permit.operatorSignature}
                                label="Firma del Operador / Trabajador"
                              />
                            </div>

                            <div className="p-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
                              <SignatureCanvas
                                onSave={(sig) => setPermit((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                                initialImage={permit.professionalSignature || professional.signature}
                                label="Firma de Especialista H&S"
                              />
                            </div>

                            <div className="p-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
                              <SignatureCanvas
                                onSave={(sig) => setPermit((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                                initialImage={permit.supervisorSignature || permit.signature}
                                label="Firma del Supervisor / Autorizante"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 2. Botones para Alternar Visibilidad de Firmas en el PDF */}
                        <div className="no-print mb-[2rem] p-[1.5rem] bg-[rgba(var(--color-surface-rgb),_0.3)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] flex flex-col gap-[1rem] items-center box-shadow-[0_8px_32px_0_rgba(0,_0,_0,_0.05)]">
                            <div className="text-[var(--color-text)] text-[0.95rem] font-[800] uppercase letter-spacing-[0.5px]">
                                <span className="inline-block border-bottom-[2px_solid_var(--color-primary)] pb-[2px]">Mostrar / Ocultar Firmas en Documento PDF</span>
                            </div>
                            <div className="flex gap-[1rem] flex-wrap justify-center">
                                {[
                                  { id: 'operator', label: 'Operador / Trabajador' },
                                  { id: 'professional', label: 'Especialista H&S' },
                                  { id: 'supervisor', label: 'Supervisor' }
                                ].map((role) => (
                                  <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => setShowSignatures((s: any) => ({ ...s, [role.id]: !s[role.id] }))}
                                    style={{
                                      border: `2px solid ${showSignatures[role.id] ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                      background: showSignatures[role.id] ? 'var(--color-primary)' : 'transparent',
                                      color: showSignatures[role.id] ? 'white' : 'var(--color-text-muted)',
                                      boxShadow: showSignatures[role.id] ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                                    }}
                                    className="p-[0.6rem_1.2rem] rounded-[var(--radius-full)] font-[700] text-[0.9rem] cursor-pointer transition-[all_0.2s] flex items-center gap-[0.5rem]"
                                  >
                                    <div
                                      style={{
                                        border: `2px solid ${showSignatures[role.id] ? 'white' : 'var(--color-border)'}`,
                                        background: showSignatures[role.id] ? 'white' : 'transparent'
                                      }}
                                      className="w-[18px] h-[18px] rounded-[50%] flex items-center justify-center"
                                    >
                                      {showSignatures[role.id] && <div className="w-[10px] h-[10px] rounded-[50%] bg-[var(--color-primary)]" />}
                                    </div>
                                    {role.label}
                                  </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Previsualización en Vivo del Documento Imprimible */}
                        <div className="mb-[2.5rem] bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
                            <h4 className="text-xs font-black text-slate-500 uppercase mb-3">Previsualización de Firmas Oficiales</h4>
                            <PdfSignatures
                              data={{
                                ...permit,
                                professionalSignature: professional.signature,
                                professionalName: professional.name,
                                professionalLicense: professional.license,
                                professionalStamp: professional.stamp
                              }}
                              box1={showSignatures.operator ? {
                                title: 'OPERADOR / TRABAJADOR',
                                subtitle: (permit.workerName || 'Firma del Operador').toUpperCase(),
                                signatureUrl: permit.operatorSignature || null,
                                isProfessional: false
                              } : null}
                              box2={showSignatures.professional ? {
                                title: 'PROFESIONAL H&S',
                                subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                                signatureUrl: permit.professionalSignature || professional.signature || null,
                                stampUrl: permit.professionalStamp || professional.stamp || null,
                                isProfessional: true,
                                license: professional.license
                              } : null}
                              box3={showSignatures.supervisor ? {
                                title: 'SUPERVISOR / AUTORIZANTE',
                                subtitle: (permit.supervisor || 'Firma del Supervisor').toUpperCase(),
                                signatureUrl: permit.supervisorSignature || permit.signature || null,
                                isProfessional: false
                              } : null}
                            />
                            <PdfBrandingFooter />
                        </div>

                        </ModuleFormSection>
                    </div>

                    {/* 4. Botones de Acción In-Line al FINAL ABSOLUTO dentro de la tarjeta */}
                    <div className="no-print mt-10 pt-6 border-t-2 border-slate-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 bg-slate-100 dark:bg-slate-900/90 p-5 rounded-2xl shadow-lg">
                      <button
                        type="button"
                        onClick={() => navigate('/working-at-height')}
                        style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '12px 24px', fontSize: '13px', fontWeight: '900', borderRadius: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}>
                        <ArrowLeft size={18} /> Cancelar / Volver
                      </button>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => requirePro(() => window.print())}
                          style={{ backgroundColor: '#8b5cf6', color: '#ffffff', border: 'none', padding: '12px 22px', fontSize: '13px', fontWeight: '900', borderRadius: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}>
                          <Printer size={18} /> Imprimir PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => requirePro(() => setShowShareModal(true))}
                          style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '12px 22px', fontSize: '13px', fontWeight: '900', borderRadius: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
                          <Share2 size={18} /> Compartir
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); requirePro(handleSave); }}
                          style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '14px 32px', fontSize: '15px', fontWeight: '900', borderRadius: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: '0 6px 20px rgba(5, 150, 105, 0.45)' }}>
                          <Save size={22} /> Guardar Permiso
                        </button>
                      </div>
                    </div>
        </div>

        {/* 5. Barra Flotante de Acciones (ModuleActionBar) - SIEMPRE VISIBLE EN PANTALLA */}
        <ModuleActionBar
          actions={[
            {
              id: 'back',
              label: 'Cancelar / Volver',
              variant: 'danger',
              icon: <ArrowLeft size={16} />,
              onClick: () => navigate('/working-at-height')
            },
            {
              id: 'print',
              label: 'Imprimir PDF',
              variant: 'secondary',
              icon: <Printer size={16} />,
              onClick: () => requirePro(() => window.print())
            },
            {
              id: 'share',
              label: 'Compartir',
              variant: 'info',
              icon: <Share2 size={16} />,
              onClick: () => requirePro(() => setShowShareModal(true))
            },
            {
              id: 'save',
              label: 'Guardar Permiso',
              variant: 'primary',
              icon: <Save size={18} />,
              onClick: (e: any) => { e.preventDefault(); requirePro(handleSave); }
            }
          ]}
        />




        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          elementIdToPrint="pdf-content"
          title="Permiso Trabajo en Altura"
          fileName={`Altura_${permit.workerName || 'Sin_Nombre'}.pdf`}
        />

        <div className="hidden print:block print:w-full">
          <WorkingAtHeightPdf data={{ ...permit, createdAt: (permit as any).createdAt || new Date().toISOString() } as any} />
        </div>
      </div>
    </AnimatedPage>
  );
}