import React, { useState, useEffect } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Save, Tent, ClipboardCheck, CheckCircle2,
  Eye, Printer, Share2, AlertTriangle, XCircle,
  User, Users, Shield, Wind, Droplets, Thermometer,
  Activity, ShieldCheck, AlertCircle, Plus, Trash2, Pencil, X } from
'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import ConfinedSpacePdf from '../components/ConfinedSpacePdf';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { ModuleFormLayout, ModuleFormDocument, ModuleFormSection, ModuleActionBar, ModuleFormToolbar } from '../components/module';

// Constants from ConfinedSpace.tsx
const CONFINED_SPACE_TYPES = [
{ id: 'tank', name: 'Tanque', icon: '🛢️' },
{ id: 'vessel', name: 'Recipiente', icon: '📦' },
{ id: 'silo', name: 'Silo', icon: '🏭' },
{ id: 'pit', name: 'Fosa', icon: '⬇️' },
{ id: 'tunnel', name: 'Túnel', icon: '🚇' },
{ id: 'sewer', name: 'Alcantarilla', icon: '🕳️' },
{ id: 'manhole', name: 'Boca de Visita', icon: '⭕' },
{ id: 'other', name: 'Otro', icon: '📍' }];


const ROLES = [
{ id: 'entrant', name: 'Entrante', icon: '👤', color: '#3b82f6' },
{ id: 'attendant', name: 'Vigía', icon: '👁️', color: '#f59e0b' },
{ id: 'supervisor', name: 'Supervisor', icon: '👔', color: '#16a34a' },
{ id: 'rescue', name: 'Rescate', icon: '🚑', color: '#dc2626' }];


const EQUIPMENT_CHECKLIST = [
{ id: 'gas_detector', name: 'Detector de Gases', icon: '💨', required: true },
{ id: 'harness', name: 'Arnés de Seguridad', icon: '🦺', required: true },
{ id: 'tripod', name: 'Trípode con Malacate', icon: '🏗️', required: true },
{ id: 'ventilator', name: 'Ventilador', icon: '💨', required: false },
{ id: 'radio', name: 'Radio Comunicación', icon: '📻', required: true },
{ id: 'light', name: 'Iluminación', icon: '💡', required: true },
{ id: 'scba', name: 'ERA (SCBA)', icon: '😷', required: false },
{ id: 'first_aid', name: 'Botiquín Primeros Auxilios', icon: '🏥', required: true },
{ id: 'fire_extinguisher', name: 'Extintor', icon: '🧯', required: true },
{ id: 'barrier', name: 'Barreras/Señalización', icon: '🚧', required: true }];


const POTENTIAL_HAZARDS = [
{ id: 'atmospheric', name: 'Atmosférico Peligroso', icon: '💨' },
{ id: 'engulfment', name: 'Atrapamiento', icon: '🌊' },
{ id: 'configuration', name: 'Configuración', icon: '📐' },
{ id: 'electrical', name: 'Eléctrico', icon: '⚡' },
{ id: 'mechanical', name: 'Mecánico', icon: '🔧' },
{ id: 'thermal', name: 'Térmico', icon: '🔥' },
{ id: 'noise', name: 'Ruido', icon: '🔊' },
{ id: 'fall', name: 'Caída', icon: '⬇️' },
{ id: 'chemical', name: 'Químico', icon: '🧪' },
{ id: 'biological', name: 'Biológico', icon: '🦠' }];


export default function ConfinedSpaceForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useDocumentTitle(isEdit ? 'Editar Permiso Espacio Confinado' : 'Permiso Espacio Confinado');

  const [permit, setPermit] = useState<any>({
    id: '',
    spaceName: '',
    spaceType: 'tank',
    location: '',
    department: '',
    description: '',
    hazards: [],
    team: {
      entrants: [],
      attendant: '',
      supervisor: '',
      rescue: ''
    },
    equipment: EQUIPMENT_CHECKLIST.map((e) => ({ ...e, checked: false })),
    gasMonitoring: { o2: '', lel: '', co: '', h2s: '', time: '' },
    ventilation: { natural: false, forced: false, extractive: false },
    importance: 'high',
    createdAt: new Date().toISOString(),
    duration: '',
    observations: '',
    signature: '',
    operatorName: '',
    operatorSignature: '',
    supervisorName: '',
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
    window.scrollTo(0, 0);
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
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    if (location.state?.editData) {
      const edit = location.state.editData;
      setPermit({
        ...edit,
        equipment: edit.equipment || EQUIPMENT_CHECKLIST.map((e) => ({ ...e, checked: false })),
        gasMonitoring: edit.gasMonitoring || { o2: '', lel: '', co: '', h2s: '', time: '' },
        ventilation: edit.ventilation || { natural: false, forced: false, extractive: false },
        hazards: edit.hazards || [],
        team: edit.team || { entrants: [], attendant: '', supervisor: '', rescue: '' },
        operatorSignature: edit.operatorSignature || '',
        supervisorSignature: edit.supervisorSignature || edit.signature || '',
        signature: edit.signature || edit.supervisorSignature || '',
        showSignatures: edit.showSignatures || { operator: true, professional: true, supervisor: true }
      });
      setIsEdit(true);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [location.state]);

  const toggleHazard = (hazardId: string) => {
    const updated = permit.hazards.includes(hazardId as never) ?
    permit.hazards.filter((h) => h !== hazardId) :
    [...permit.hazards, hazardId];
    setPermit({ ...permit, hazards: updated as never[] });
  };

  const toggleEquipment = (equipId: string) => {
    const updated = permit.equipment.map((e) =>
    e.id === equipId ? { ...e, checked: !e.checked } : e
    );
    setPermit({ ...permit, equipment: updated });
  };

  const addTeamMember = (role: string, name: string) => {
    if (role === 'entrant') {
      setPermit({
        ...permit,
        team: { ...permit.team, entrants: [...permit.team.entrants, name as never] }
      });
    } else {
      setPermit({
        ...permit,
        team: { ...permit.team, [role]: name }
      });
    }
  };

  const handleSave = () => {
    if (!permit.spaceName || !permit.location || !permit.team.attendant || !permit.team.supervisor) {
      toast.error('Por favor complete los campos obligatorios (*)');
      return;
    }

    const saved = JSON.parse(localStorage.getItem('confined_space_permits_db') || '[]');
    let updated;

    const saveObj = {
      ...permit,
      signature: permit.supervisorSignature || permit.signature || '',
      supervisorSignature: permit.supervisorSignature || permit.signature || ''
    };

    if (isEdit) {
      updated = saved.map((p: any) => p.id === permit.id ? saveObj : p);
      toast.success('Permiso actualizado');
    } else {
      const newEntry = {
        ...saveObj,
        id: `CS-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: permit.status || 'pending'
      };
      updated = [newEntry, ...saved];
      toast.success('Permiso guardado');
    }

    localStorage.setItem('confined_space_permits_db', JSON.stringify(updated));
    navigate('/confined-space');
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    marginBottom: '0.5rem'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-input-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontSize: '0.95rem',
    fontWeight: 500,
    outline: 'none',
    transition: 'all var(--transition-fast)',
    boxSizing: 'border-box' as const
  };

  return (
    <div className="container min-h-[100vh] pb-[8rem]">
            <ModuleFormLayout>
                <ModuleFormToolbar
                    title={isEdit ? 'Editar Permiso Espacio Confinado' : 'Nuevo Permiso OSHA 1910.146'}
                    subtitle="Registro de ingreso y condiciones de seguridad"
                    icon={<Tent size={36} color="#ffffff" />}
                />
                
                <ModuleFormDocument id="pdf-content">
                    {/* Sección: Información General */}
                    <ModuleFormSection title="Información del Espacio" icon={<ClipboardCheck size={20} />}>
                    <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[1.5rem] mb-[2.5rem]">
                        <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Nombre del Espacio *</label>
                            <input type="text" className="input-professional" value={permit.spaceName} onChange={(e) => setPermit({ ...permit, spaceName: e.target.value })} placeholder="Ej: Tanque de Almacenamiento T-101" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Tipo de Espacio</label>
                            <select className="input-professional" value={permit.spaceType} onChange={(e) => setPermit({ ...permit, spaceType: e.target.value })}>
                                {CONFINED_SPACE_TYPES.map((t) =>
                <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                )}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Ubicación / Planta *</label>
                            <input type="text" className="input-professional" value={permit.location} onChange={(e) => setPermit({ ...permit, location: e.target.value })} placeholder="Ej: Planta Norte, Sector B" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Departamento</label>
                            <input type="text" className="input-professional" value={permit.department} onChange={(e) => setPermit({ ...permit, department: e.target.value })} placeholder="Mantenimiento / Operaciones" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Duración Estimada</label>
                            <input type="text" className="input-professional" value={permit.duration || ''} onChange={(e) => setPermit({ ...permit, duration: e.target.value })} placeholder="Ej: 4 horas" />
                        </div>
                        <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Descripción del Trabajo</label>
                            <input type="text" className="input-professional" value={permit.description} onChange={(e) => setPermit({ ...permit, description: e.target.value })} placeholder="Limpieza, soldadura, inspección..." />
                        </div>
                    </div>
                    </ModuleFormSection>

                    {/* Sección: Peligros */}
                    <ModuleFormSection title="Peligros Potenciales" icon={<AlertTriangle size={20} />}>
                    <div style={{ gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)' }} className="grid gap-[0.75rem] mb-[2.5rem]">
                        {POTENTIAL_HAZARDS.map((hazard) =>
            <button
              key={hazard.id}
              onClick={() => toggleHazard(hazard.id)}
              style={{

                background: permit.hazards.includes(hazard.id as never) ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-surface)',
                border: `2px solid ${permit.hazards.includes(hazard.id as never) ? '#ef4444' : 'var(--color-border)'}`




              }} className="p-[0.75rem_0.5rem] rounded-[var(--radius-lg)] cursor-pointer flex flex-col items-center gap-[0.5rem] transition-[all_0.2s]">
              
                                <span className="text-[1.5rem]">{hazard.icon}</span>
                                <span className="text-[0.7rem] font-[800] text-center">{hazard.name}</span>
                            </button>
            )}
                    </div>
                    </ModuleFormSection>

                    {/* Sección: Equipamiento */}
                    <ModuleFormSection title="Equipamiento Requerido" icon={<ShieldCheck size={20} />}>
                    <div style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)' }} className="grid gap-[0.75rem] mb-[2.5rem]">
                        {permit.equipment.map((equip) =>
            <label key={equip.id} style={{

              background: equip.checked ? 'rgba(16, 163, 74, 0.1)' : 'var(--color-surface)',
              border: `2px solid ${equip.checked ? '#16a34a' : 'var(--color-border)'}`



            }} className="p-[1rem] rounded-[var(--radius-lg)] cursor-pointer flex items-center gap-[1rem]">
                                <input type="checkbox" checked={equip.checked} onChange={() => toggleEquipment(equip.id)} className="w-[20px] h-[20px]" />
                                <span className="text-[1.2rem]">{equip.icon}</span>
                                <div className="flex-[1]">
                                    <div className="text-[0.85rem] font-[700]">{equip.name}</div>
                                    {equip.required && <div className="text-[0.7rem] text-[#dc2626] font-[800]">REQUERIDO</div>}
                                </div>
                            </label>
            )}
                    </div>
                    </ModuleFormSection>

                    {/* Sección: Equipo de Trabajo */}
                    <ModuleFormSection title="Equipo de Trabajo" icon={<Users size={20} />}>
                    <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[1.5rem] mb-[2rem]">
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Entrante(s) Autorizado(s)</label>
                            <div className="flex gap-[0.5rem] mb-[0.5rem]">
                                <input id="entrant-input" type="text" className="input-professional" placeholder="Nombre completo" onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) {addTeamMember('entrant', val);(e.target as HTMLInputElement).value = '';}
                  }
                }} />
                                <button onClick={() => {
                  const input = document.getElementById('entrant-input') as HTMLInputElement;
                  const val = input.value.trim();
                  if (val) {addTeamMember('entrant', val);input.value = '';}
                }} className="btn-primary w-[auto] m-[0] p-[0_1rem]"><Plus size={20} /></button>
                            </div>
                            <div className="flex flex-wrap gap-[0.5rem]">
                                {permit.team.entrants.map((entrant, idx) =>
                <span key={idx} className="p-[0.4rem_0.85rem] bg-[#eff6ff] border-[1px_solid_#3b82f6] rounded-[var(--radius-full)] text-[0.8rem] font-[700] flex items-center gap-[0.5rem]">
                                        {entrant}
                                        <Trash2 size={14} onClick={() => {
                    const updated = permit.team.entrants.filter((_, i) => i !== idx);
                    setPermit({ ...permit, team: { ...permit.team, entrants: updated } });
                  }} className="cursor-pointer text-[#ef4444]" />
                                    </span>
                )}
                            </div>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Vigía de Seguridad *</label>
                            <input type="text" className="input-professional" value={permit.team.attendant} onChange={(e) => setPermit({ ...permit, team: { ...permit.team, attendant: e.target.value } })} placeholder="Nombre del vigía" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Supervisor de Entrada *</label>
                            <input type="text" className="input-professional" value={permit.team.supervisor} onChange={(e) => setPermit({ ...permit, team: { ...permit.team, supervisor: e.target.value } })} placeholder="Nombre del supervisor" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Equipo de Rescate</label>
                            <input type="text" className="input-professional" value={permit.team.rescue} onChange={(e) => setPermit({ ...permit, team: { ...permit.team, rescue: e.target.value } })} placeholder="Empresa o equipo interno" />
                        </div>
                    </div>
                    </ModuleFormSection>

                    {/* Sección: Monitoreo Atmosférico */}
                    <ModuleFormSection title="Monitoreo Atmosférico" icon={<Activity size={20} />}>
                    <div style={{ gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)' }} className="grid gap-[1rem] mb-[2rem]">
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">O₂ (%)</label>
                            <input type="number" step="0.1" className="input-professional" value={permit.gasMonitoring?.o2 || ''} onChange={(e) => setPermit({ ...permit, gasMonitoring: { ...permit.gasMonitoring, o2: e.target.value } })} placeholder="20.9" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">LEL (%)</label>
                            <input type="number" step="1" className="input-professional" value={permit.gasMonitoring?.lel || ''} onChange={(e) => setPermit({ ...permit, gasMonitoring: { ...permit.gasMonitoring, lel: e.target.value } })} placeholder="0" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">CO (ppm)</label>
                            <input type="number" step="1" className="input-professional" value={permit.gasMonitoring?.co || ''} onChange={(e) => setPermit({ ...permit, gasMonitoring: { ...permit.gasMonitoring, co: e.target.value } })} placeholder="0" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">H₂S (ppm)</label>
                            <input type="number" step="1" className="input-professional" value={permit.gasMonitoring?.h2s || ''} onChange={(e) => setPermit({ ...permit, gasMonitoring: { ...permit.gasMonitoring, h2s: e.target.value } })} placeholder="0" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Hora Medición</label>
                            <input type="time" className="input-professional" value={permit.gasMonitoring?.time || ''} onChange={(e) => setPermit({ ...permit, gasMonitoring: { ...permit.gasMonitoring, time: e.target.value } })} />
                        </div>
                    </div>
                    </ModuleFormSection>

                    {/* Sección: Ventilación */}
                    <ModuleFormSection title="Ventilación" icon={<Wind size={20} />}>
                    <div className="flex gap-[1.5rem] mb-[2rem] flex-wrap">
                        <label className="flex items-center gap-[0.5rem] cursor-pointer">
                            <input type="checkbox" checked={permit.ventilation?.natural || false} onChange={(e) => setPermit({ ...permit, ventilation: { ...permit.ventilation, natural: e.target.checked } })} className="w-[20px] h-[20px]" />
                            <span className="font-[700]">Natural</span>
                        </label>
                        <label className="flex items-center gap-[0.5rem] cursor-pointer">
                            <input type="checkbox" checked={permit.ventilation?.forced || false} onChange={(e) => setPermit({ ...permit, ventilation: { ...permit.ventilation, forced: e.target.checked } })} className="w-[20px] h-[20px]" />
                            <span className="font-[700]">Forzada</span>
                        </label>
                        <label className="flex items-center gap-[0.5rem] cursor-pointer">
                            <input type="checkbox" checked={permit.ventilation?.extractive || false} onChange={(e) => setPermit({ ...permit, ventilation: { ...permit.ventilation, extractive: e.target.checked } })} className="w-[20px] h-[20px]" />
                            <span className="font-[700]">Extractiva</span>
                        </label>
                    </div>
                    </ModuleFormSection>

                    {/* Observaciones */}
                    <ModuleFormSection title="Observaciones Finales" icon={<Activity size={20} />}>
                    <textarea
            className="input-professional min-h-[120px]"
            value={permit.observations}
            onChange={(e) => setPermit({ ...permit, observations: e.target.value })}

            placeholder="Detalles adicionales, medidas preventivas específicas, condiciones climáticas, etc." />
                    </ModuleFormSection>

                    <div className="mt-[2.5rem]">
                        <ModuleFormSection title="Firmas y Autorizaciones" icon={<Pencil size={20} />}>

                        <div className="no-print mb-8 p-6 bg-[rgba(30,_41,_59,_0.2)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] w-[100%] flex flex-col gap-[1.25rem] justify-center items-center">
                            <div className="text-[var(--color-text)] font-[800] text-[0.85rem] uppercase letter-spacing-[0.5px]">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                            <div className="flex gap-[1rem] flex-wrap justify-center">
                                {[
                { id: 'operator', label: 'Responsable / Entrante' },
                { id: 'professional', label: 'Profesional H&S' },
                { id: 'supervisor', label: 'Autorización de Ingreso' }].
                map((sig) => {
                  const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                  return (
                    <label
                      key={sig.id}
                      className="flex items-center gap-2 cursor-pointer select-none p-[0.55rem_1.1rem] rounded-[var(--radius-full)] font-[750] text-[0.8rem] transition-[all_0.2s_ease]"
                      style={{


                        border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: isChecked ? 'rgba(var(--color-primary-rgb), 0.15)' : 'transparent',
                        color: isChecked ? 'var(--color-primary)' : 'var(--color-text-light)',



                        boxShadow: isChecked ? '0 0 10px rgba(var(--color-primary-rgb), 0.15)' : 'none'
                      }}>
                      
                                            <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))} className="none" />

                      
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
                  title: 'RESPONSABLE / ENTRANTE',
                  subtitle: 'Control de Ingreso',
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
                  title: 'AUTORIZACIÓN DE INGRESO',
                  subtitle: 'Firma del Autorizante',
                  signatureUrl: permit.supervisorSignature || permit.signature || null,
                  isProfessional: false
                } : null} />
              
            <PdfBrandingFooter />
                        </div>

                        {/* Interactive Signature Drawing Pads */}
                        <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid gap-[2rem] mt-[2rem] pt-[2rem] border-top-[1px_solid_var(--color-border)]" style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                            {showSignatures.operator &&
              <div className="flex flex-col gap-4">
                                    <div>
                                        <label className="text-[0.8rem] font-[700] text-[var(--color-text-muted)] mb-[0.5rem] block">Nombre del Responsable / Entrante</label>
                                        <input type="text" className="input-professional" value={permit.operatorName || ''} onChange={(e) => setPermit({ ...permit, operatorName: e.target.value })} placeholder="Nombre y Apellido" />
                                    </div>
                                    <SignatureCanvas
                  onSave={(sig) => setPermit((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                  initialImage={permit.operatorSignature}
                  label="Firma de Responsable / Entrante" />
                
                                </div>
              }
                            
                            {showSignatures.professional &&
              <SignatureCanvas
                onSave={(sig) => setPermit((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                initialImage={permit.professionalSignature || professional.signature}
                label="Firma de Profesional H&S" />

              }

                            {showSignatures.supervisor &&
              <div className="flex flex-col gap-4">
                                    <div>
                                        <label className="text-[0.8rem] font-[700] text-[var(--color-text-muted)] mb-[0.5rem] block">Nombre de Autorización de Ingreso</label>
                                        <input type="text" className="input-professional" value={permit.supervisorName || ''} onChange={(e) => setPermit({ ...permit, supervisorName: e.target.value })} placeholder="Nombre y Apellido" />
                                    </div>
                                    <SignatureCanvas
                  onSave={(sig) => setPermit((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                  initialImage={permit.supervisorSignature || permit.signature}
                  label="Firma de Autorización de Ingreso" />
                
                                </div>
              }
                        </div>
                          </ModuleFormSection>
                    </div>
                </ModuleFormDocument>
            </ModuleFormLayout>

            <ModuleActionBar actions={[
                { id: 'cancel', label: 'CANCELAR', icon: <X size={18} />, variant: 'secondary', onClick: () => navigate(-1) },
                { id: 'share', label: 'COMPARTIR', icon: <Share2 size={18} />, variant: 'secondary', onClick: () => setShowShareModal(true) },
                { id: 'save', label: 'GENERAR PERMISO', icon: <Save size={18} />, variant: 'primary', onClick: (e: any) => { e.preventDefault(); requirePro(handleSave); } }
            ]} />

            <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Permiso de Ingreso"
        text={`Permiso de Espacio Confinado: ${permit.spaceName}`}
        rawMessage={`Permiso de Espacio Confinado: ${permit.spaceName}`}
        fileName={`Permiso_${permit.spaceName || 'Sin_Nombre'}.pdf`} />
      

            <div className="print-only fixed left-[0] opacity-[0.01] top-[0]">
                <ConfinedSpacePdf data={{ ...permit, createdAt: permit.createdAt || new Date().toISOString() }} />
            </div>
        </div>);

}

function SectionTitle({ icon, title }: {icon: React.ReactNode;title: string;}) {
  return (
    <div className="flex items-center gap-[0.75rem] mb-[1.25rem] pb-[0.75rem] border-bottom-[1px_solid_var(--color-border)]">
            <span className="text-[var(--color-primary)]">{icon}</span>
            <h3 className="m-[0] text-[1rem] font-[800] uppercase letter-spacing-[0.5px]">{title}</h3>
        </div>);

}