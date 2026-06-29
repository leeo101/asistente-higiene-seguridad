import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, ArrowDown, Shield, AlertTriangle, Clock, CheckCircle2, User, MapPin, Ruler, Eye, Printer, Share2, Pencil } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import WorkingAtHeightPdf from '../components/WorkingAtHeightPdf';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import PremiumHeader from '../components/PremiumHeader';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { ModuleFormLayout, ModuleFormDocument, ModuleFormSection, ModuleActionBar, ModuleFormToolbar } from '../components/module';

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
    <div className="container min-h-[100vh] pb-[8rem]">
            <ModuleFormLayout>
                <ModuleFormToolbar
                    title={isEdit ? 'Editar Permiso en Altura' : 'Permiso de Trabajo en Altura'}
                    subtitle="Gestión de permisos según OSHA 1926.501"
                    icon={<ArrowDown size={36} color="#ffffff" />}
                />
                <ModuleFormDocument>
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

                  background: permit.medicalFitness ? 'rgba(16, 185, 129, 0.05)' : 'rgba(220, 38, 38, 0.05)',
                  border: `2px dashed ${permit.medicalFitness ? 'var(--color-success)' : '#dc2626'}`




                }} className="p-[1.5rem] rounded-[var(--radius-xl)] flex flex-col gap-[1rem]">
                                    <div className="flex items-center gap-4">
                                        <button
                      onClick={() => setPermit({ ...permit, medicalFitness: !permit.medicalFitness })}
                      style={{

                        border: `3px solid ${permit.medicalFitness ? 'var(--color-success)' : '#dc2626'}`,
                        background: permit.medicalFitness ? 'var(--color-success)' : 'transparent'


                      }} className="w-[40px] h-[40px] rounded-[50%] flex items-center justify-center cursor-pointer transition-[all_0.2s] flex-shrink-[0]">
                      
                                            {permit.medicalFitness && <CheckCircle2 size={24} color="#fff" />}
                                        </button>
                                        <div>
                                            <span style={{ color: permit.medicalFitness ? 'var(--color-success)' : '#dc2626' }} className="text-[1.1rem] font-[900] block">
                                                Apto Médico Vigente
                                            </span>
                                            <span className="text-[0.8rem] text-[var(--color-text-muted)]">
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
                                        {['good', 'bad', 'na'].map((status) =>
                  <button
                    key={status}
                    onClick={() => setPermit({ ...permit, equipmentCheck: { ...permit.equipmentCheck, [key]: status } })}
                    style={{






                      background: value === status ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: value === status ? 'white' : 'var(--color-text)'

                    }} className="flex-[1] p-[0.5rem] text-[0.8rem] font-[700] rounded-[var(--radius-md)] border-[1px_solid_var(--color-border)] cursor-pointer">
                    
                                                {status === 'good' ? 'B' : status === 'bad' ? 'M' : 'N/A'}
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
                onClick={() => setPermit({ ...permit, ppe: { ...permit.ppe, [key]: !value } })}
                style={{

                  background: value ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-background)',
                  border: `2px solid ${value ? 'var(--color-primary)' : 'var(--color-border)'}`






                }} className="p-[1rem] rounded-[var(--radius-lg)] cursor-pointer flex items-center gap-[0.75rem] transition-[all_0.2s]">
                
                                    <div style={{ background: value ? 'var(--color-primary)' : 'transparent' }} className="w-[20px] h-[20px] rounded-[4px] border-[2px_solid_var(--color-primary)] flex items-center justify-center">
                                        {value && <CheckCircle2 size={14} color="#fff" />}
                                    </div>
                                    <span className="text-[0.9rem] font-[700] capitalize">
                                        {key === 'harness' && 'Arnés de Seguridad'}
                                        {key === 'lanyard' && 'Cola de Amarre'}
                                        {key === 'helmet' && 'Casco con Barbijo'}
                                        {key === 'lifeline' && 'Línea de Vida'}
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

                        <div className="no-print mb-[2rem] p-[1.5rem] bg-[rgba(var(--color-surface-rgb),_0.3)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] flex flex-col gap-[1rem] items-center box-shadow-[0_8px_32px_0_rgba(0,_0,_0,_0.05)]">
                            <div className="text-[var(--color-text)] text-[0.95rem] font-[800] uppercase letter-spacing-[0.5px]">
                                <span className="inline-block border-bottom-[2px_solid_var(--color-primary)] pb-[2px]">Personalizar Firmas del Documento</span>
                            </div>
                            <div className="flex gap-[1rem] flex-wrap justify-center">
                                {[
                { id: 'operator', label: 'Operador / Trabajador' },
                { id: 'professional', label: 'Especialista H&S' },
                { id: 'supervisor', label: 'Supervisor' }].
                map((role) =>
                <button
                  key={role.id}
                  onClick={() => setShowSignatures((s: any) => ({ ...s, [role.id]: !s[role.id] }))}
                  style={{


                    border: `2px solid ${showSignatures[role.id] ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: showSignatures[role.id] ? 'var(--color-primary)' : 'transparent',
                    color: showSignatures[role.id] ? 'white' : 'var(--color-text-muted)',







                    boxShadow: showSignatures[role.id] ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                  }} className="p-[0.6rem_1.2rem] rounded-[var(--radius-full)] font-[700] text-[0.9rem] cursor-pointer transition-[all_0.2s] flex items-center gap-[0.5rem]">
                  
                                        <div style={{

                    border: `2px solid ${showSignatures[role.id] ? 'white' : 'var(--color-border)'}`,

                    background: showSignatures[role.id] ? 'white' : 'transparent'
                  }} className="w-[18px] h-[18px] rounded-[50%] flex items-center justify-center">
                                            {showSignatures[role.id] && <div className="w-[10px] h-[10px] rounded-[50%] bg-[var(--color-primary)]" />}
                                        </div>
                                        {role.label}
                                    </button>
                )}
                            </div>
                        </div>

                        {/* On-Sheet Visual Preview of PDF signature blocks */}
                        <div className="mb-[2.5rem]">
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
                } : null} />
              
            <PdfBrandingFooter />
                        </div>

                        {/* Interactive Signature Drawing Pads */}
                        <div className="no-print animate-fade-in grid grid-template-columns-[1fr] gap-[2rem] mt-[2rem] pt-[2rem] border-top-[1px_solid_var(--color-border)]">
                            <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(280px,_1fr))] gap-[2rem]">
                                {showSignatures.operator &&
                <div className="card p-[1rem] bg-[rgba(var(--color-surface-rgb),_0.3)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)]">
                                        <SignatureCanvas
                    onSave={(sig) => setPermit((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                    initialImage={permit.operatorSignature}
                    label="Firma del Operador / Trabajador" />
                  
                                    </div>
                }
                                
                                {showSignatures.professional &&
                <div className="card p-[1rem] bg-[rgba(var(--color-surface-rgb),_0.3)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)]">
                                        <SignatureCanvas
                    onSave={(sig) => setPermit((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                    initialImage={permit.professionalSignature || professional.signature}
                    label="Firma de Especialista H&S" />
                  
                                    </div>
                }

                                {showSignatures.supervisor &&
                <div className="card p-[1rem] bg-[rgba(var(--color-surface-rgb),_0.3)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)]">
                                        <SignatureCanvas
                    onSave={(sig) => setPermit((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                    initialImage={permit.supervisorSignature || permit.signature}
                    label="Firma del Supervisor / Autorizante" />
                  
                                    </div>
                }
                            </div>
                        </div>
                           </ModuleFormSection>
                    </div>
                </ModuleFormDocument>
            </ModuleFormLayout>

            <ModuleActionBar actions={[
                { id: 'print', label: 'IMPRIMIR PDF', icon: <Printer size={18} />, variant: 'secondary', onClick: () => requirePro(() => window.print()) },
                { id: 'share', label: 'COMPARTIR', icon: <Share2 size={18} />, variant: 'secondary', onClick: () => requirePro(() => setShowShareModal(true)) },
                { id: 'save', label: 'GUARDAR PERMISO', icon: <Save size={18} />, variant: 'primary', onClick: (e: any) => { e.preventDefault(); requirePro(handleSave); } }
            ]} />

            <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Permiso Trabajo en Altura"
        fileName={`Altura_${permit.workerName || 'Sin_Nombre'}.pdf`} />
      

            <div id="pdf-content" className="print-only fixed left-[0] opacity-[0.01] top-[0]">
                <WorkingAtHeightPdf data={{ ...permit, createdAt: (permit as any).createdAt || new Date().toISOString() } as any} />
            </div>
        </div>);

}