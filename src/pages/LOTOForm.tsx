import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Lock, Save, Eye, CheckCircle2, Printer, Share2, Pencil } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import LOTOPdf from '../components/LOTOPdf';
import PdfSignatures from '../components/PdfSignatures';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PremiumHeader from '../components/PremiumHeader';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

const ENERGY_TYPES = [
{ id: 'electrical', name: 'Eléctrica', icon: '⚡', color: '#fbbf24' },
{ id: 'mechanical', name: 'Mecánica', icon: '🔧', color: '#6b7280' },
{ id: 'hydraulic', name: 'Hidráulica', icon: '💧', color: '#3b82f6' },
{ id: 'pneumatic', name: 'Neumática', icon: '💨', color: '#9ca3af' },
{ id: 'chemical', name: 'Química', icon: '🧪', color: '#10b981' },
{ id: 'thermal', name: 'Térmica', icon: '🔥', color: '#ef4444' }];


const LOTO_DEVICES = [
{ id: 'padlock', name: 'Candado', icon: '🔒' },
{ id: 'hasp', name: 'Grampa Múltiple', icon: '📎' },
{ id: 'breaker_lock', name: 'Bloqueo Interruptor', icon: '⚡' },
{ id: 'valve_lock', name: 'Bloqueo Válvula', icon: '🔩' },
{ id: 'tagout', name: 'Etiqueta', icon: '🏷️' }];


const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.5rem',
  fontSize: '0.9rem',
  fontWeight: 700,
  color: 'var(--color-text)'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '12px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-background)',
  color: 'var(--color-text)',
  fontSize: '1rem',
  outline: 'none',
  boxSizing: 'border-box' as any,
  transition: 'all 0.2s'
};

export default function LOTOForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const { isPro } = usePaywall();

  useDocumentTitle(isEdit ? 'Editar Procedimiento LOTO' : 'Nuevo Procedimiento LOTO');
  const [procedure, setProcedure] = useState<any>({
    equipmentName: '',
    location: '',
    department: '',
    energyTypes: [],
    lotoDevices: [],
    supervisor: '',
    observations: '',
    isolationPoints: '',
    zeroEnergyVerification: {
      tested: false,
      method: 'try_start',
      result: 'safe'
    },
    signature: '',
    operatorSignature: '',
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
    setProcedure((prev: any) => {
      const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
      return { ...prev, showSignatures: updated };
    });
  };

  const showSignatures = procedure.showSignatures || { operator: true, professional: true, supervisor: true };

  useEffect(() => {
    if (location.state?.editData) {
      const ed = location.state.editData;
      setProcedure({
        ...ed,
        operatorSignature: ed.operatorSignature || '',
        supervisorSignature: ed.supervisorSignature || ed.signature || '',
        signature: ed.signature || ed.supervisorSignature || '',
        showSignatures: ed.showSignatures || { operator: true, professional: true, supervisor: true }
      });
      setIsEdit(true);
    }
  }, [location.state]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
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

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleEnergy = (id) => {
    const updated = procedure.energyTypes.includes(id) ?
    procedure.energyTypes.filter((e) => e !== id) :
    [...procedure.energyTypes, id];
    setProcedure({ ...procedure, energyTypes: updated });
  };

  const toggleDevice = (id) => {
    const updated = procedure.lotoDevices.includes(id) ?
    procedure.lotoDevices.filter((d) => d !== id) :
    [...procedure.lotoDevices, id];
    setProcedure({ ...procedure, lotoDevices: updated });
  };

  const handleSave = () => {
    if (!procedure.equipmentName) {
      toast.error('Por favor complete el nombre del equipo');
      return;
    }

    const saved = JSON.parse(localStorage.getItem('loto_procedures_db') || '[]');
    let updated;

    const newEntry = {
      ...procedure,
      id: `LOTO-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
      professionalSignature: procedure.professionalSignature || professional.signature,
      professionalName: procedure.professionalName || professional.name,
      professionalLicense: procedure.professionalLicense || professional.license,
      professionalStamp: procedure.professionalStamp || professional.stamp
    };

    if (isEdit) {
      const entryToSave = {
        ...procedure,
        professionalSignature: procedure.professionalSignature || professional.signature,
        professionalName: procedure.professionalName || professional.name,
        professionalLicense: procedure.professionalLicense || professional.license,
        professionalStamp: procedure.professionalStamp || professional.stamp
      };
      updated = saved.map((p: any) => p.id === (procedure as any).id ? entryToSave : p);
      toast.success('Procedimiento actualizado');
    } else {
      updated = [newEntry, ...saved];
      toast.success('Procedimiento guardado');
    }

    localStorage.setItem('loto_procedures_db', JSON.stringify(updated));
    navigate('/loto');
  };

  return (
    <div className="min-h-[100vh] bg-[var(--color-background)] pb-[2rem]">
            <PremiumHeader
        title={isEdit ? 'Editar LOTO' : 'Nuevo LOTO'}
        subtitle="Procedimiento de Bloqueo y Etiquetado"
        icon={<Lock size={32} color="#ffffff" />}
        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
      

            <div className="flex gap-[1rem] mb-[1.5rem] mt-[1.5rem] p-[0_1.5rem] max-w-[800px] m-[1.5rem_auto_0]">
                <></>
            </div>

            <main className="p-[3.5rem_1.5rem_1.5rem] max-w-[800px] m-[0_auto]">
                <div className="card p-[2rem] bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border)]">
                    <div className="flex items-center gap-[1rem] mb-[2rem] pb-[1rem] border-bottom-[1px_solid_var(--color-border)]">
              <div className="w-[44] h-[44] bg-[linear-gradient(135deg,_#2563eb,_#1d4ed8)] rounded-[12] flex items-center justify-center box-shadow-[0_4px_15px_rgba(37,99,235,0.3)]">
                  <Lock size={22} color="#fff" />
              </div>
              <div>
                  <h2 className="m-[0] text-[1.25rem] font-[800] text-[var(--color-text)]">Datos Generales del Procedimiento</h2>
                  <p className="m-[0] text-[0.85rem] text-[var(--color-text-muted)]">Información del equipo a bloquear</p>
              </div>
            </div>
            <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[1.5rem]">
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Nombre del Equipo *</label>
                            <input type="text" value={procedure.equipmentName} onChange={(e) => setProcedure({ ...procedure, equipmentName: e.target.value })} className="input-professional" placeholder="Ej: Compresor Principal" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Ubicación</label>
                            <input type="text" value={procedure.location} onChange={(e) => setProcedure({ ...procedure, location: e.target.value })} className="input-professional" placeholder="Ej: Sala de Máquinas" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Departamento</label>
                            <input type="text" value={procedure.department} onChange={(e) => setProcedure({ ...procedure, department: e.target.value })} className="input-professional" placeholder="Ej: Mantenimiento" />
                        </div>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Supervisor / Responsable</label>
                            <input type="text" value={procedure.supervisor} onChange={(e) => setProcedure({ ...procedure, supervisor: e.target.value })} className="input-professional" placeholder="Nombre completo" />
                        </div>
                    </div>

                    <div className="mt-[2.5rem]">
                        <div className="flex items-center gap-[1rem] mb-[2rem] pb-[1rem] border-bottom-[1px_solid_var(--color-border)]">
              <div className="w-[44] h-[44] bg-[linear-gradient(135deg,_#dc2626,_#991b1b)] rounded-[12] flex items-center justify-center box-shadow-[0_4px_15px_rgba(220,38,38,0.3)]">
                  <span className="text-[1.2rem]">⚡</span>
              </div>
              <div>
                  <h2 className="m-[0] text-[1.25rem] font-[800] text-[var(--color-text)]">Paso 1: Fuentes de Energía</h2>
                  <p className="m-[0] text-[0.85rem] text-[var(--color-text-muted)]">Identifique las energías a bloquear</p>
              </div>
            </div>
                        <div style={{ gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)' }} className="grid gap-[1.2rem]">
                            {ENERGY_TYPES.map((type) => {
                const isSelected = procedure.energyTypes.includes(type.id);
                return (
                  <button
                    key={type.id}
                    onClick={() => toggleEnergy(type.id)}
                    style={{

                      background: isSelected ? `${type.color}15` : 'var(--color-surface)',
                      border: `2px solid ${isSelected ? type.color : 'var(--color-border)'}`,







                      boxShadow: isSelected ? `0 0 20px ${type.color}30` : '0 2px 4px rgba(0,0,0,0.02)',
                      transform: isSelected ? 'translateY(-2px)' : 'none'
                    }} className="p-[1.5rem_1rem] rounded-[var(--radius-xl)] cursor-pointer flex flex-col items-center gap-[0.8rem] transition-[all_0.3s_cubic-bezier(0.4,_0,_0.2,_1)]">
                    
                                        <div style={{

                      filter: isSelected ? `drop-shadow(0 0 10px ${type.color})` : 'grayscale(100%) opacity(60%)'

                    }} className="text-[2.5rem] transition-[all_0.3s]">
                                            {type.icon}
                                        </div>
                                        <span style={{ color: isSelected ? type.color : 'var(--color-text-muted)' }} className="text-[0.85rem] font-[900] uppercase letter-spacing-[0.5px]">{type.name}</span>
                                    </button>);

              })}
                        </div>
                    </div>

                    <div className="mt-[2.5rem]">
                        <div className="flex items-center gap-[1rem] mb-[2rem] pb-[1rem] border-bottom-[1px_solid_var(--color-border)]">
              <div className="w-[44] h-[44] bg-[linear-gradient(135deg,_#f59e0b,_#d97706)] rounded-[12] flex items-center justify-center box-shadow-[0_4px_15px_rgba(245,158,11,0.3)]">
                  <span className="text-[1.2rem]">🔒</span>
              </div>
              <div>
                  <h2 className="m-[0] text-[1.25rem] font-[800] text-[var(--color-text)]">Paso 2: Dispositivos de Bloqueo</h2>
                  <p className="m-[0] text-[0.85rem] text-[var(--color-text-muted)]">Elementos LOTO a utilizar</p>
              </div>
            </div>
                        <div style={{ gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)' }} className="grid gap-[1rem]">
                            {LOTO_DEVICES.map((device) => {
                const isSelected = procedure.lotoDevices.includes(device.id);
                return (
                  <button
                    key={device.id}
                    onClick={() => toggleDevice(device.id)}
                    style={{

                      background: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: isSelected ? '#fff' : 'var(--color-text)',
                      border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,







                      boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                    }} className="p-[1rem] rounded-[var(--radius-xl)] cursor-pointer flex items-center gap-[0.75rem] font-[800] transition-[all_0.2s]">
                    
                                        <span style={{ filter: isSelected ? 'none' : 'grayscale(100%)' }} className="text-[1.5rem]">{device.icon}</span>
                                        <span className="text-[0.8rem]">{device.name}</span>
                                    </button>);

              })}
                        </div>
                    </div>

                    <div className="mt-[2.5rem]">
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Puntos de Aislamiento Específicos</label>
                        <input
              type="text"
              value={procedure.isolationPoints}
              onChange={(e) => setProcedure({ ...procedure, isolationPoints: e.target.value })}
              className="input-professional"
              placeholder="Ej: Interruptor Principal Q1, Válvula Entrada Vapor V-01" />
            
                    </div>

                    <div className="mt-[2.5rem]">
                        <div className="flex items-center gap-[1rem] mb-[2rem] pb-[1rem] border-bottom-[1px_solid_var(--color-border)]">
              <div className="w-[44] h-[44] bg-[linear-gradient(135deg,_#16a34a,_#15803d)] rounded-[12] flex items-center justify-center box-shadow-[0_4px_15px_rgba(22,163,74,0.3)]">
                  <CheckCircle2 size={22} color="#fff" />
              </div>
              <div>
                  <h2 className="m-[0] text-[1.25rem] font-[800] text-[var(--color-text)]">Paso 3: Energía Cero</h2>
                  <p className="m-[0] text-[0.85rem] text-[var(--color-text-muted)]">Verificación y try-out</p>
              </div>
            </div>
                        <div style={{

              background: procedure.zeroEnergyVerification.tested ? 'rgba(16, 185, 129, 0.05)' : 'var(--color-surface)',

              border: `2px solid ${procedure.zeroEnergyVerification.tested ? 'var(--color-success)' : 'var(--color-border)'}`

            }} className="flex flex-col gap-[1.5rem] p-[2rem] rounded-[var(--radius-xl)] transition-[all_0.3s]">
                            <div style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }} className="flex gap-[1.5rem]">
                                <button
                  onClick={() => setProcedure({ ...procedure, zeroEnergyVerification: { ...procedure.zeroEnergyVerification, tested: !procedure.zeroEnergyVerification.tested } })}
                  style={{

                    border: `3px solid ${procedure.zeroEnergyVerification.tested ? 'var(--color-success)' : 'var(--color-text-muted)'}`,
                    background: procedure.zeroEnergyVerification.tested ? 'var(--color-success)' : 'transparent',


                    boxShadow: procedure.zeroEnergyVerification.tested ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none'
                  }} className="w-[60px] h-[60px] rounded-[50%] flex items-center justify-center cursor-pointer transition-[all_0.3s] flex-shrink-[0]">
                  
                                    {procedure.zeroEnergyVerification.tested ? <CheckCircle2 size={32} color="#fff" /> : <div className="w-[20px] h-[20px] rounded-[50%] border-[2px_solid_var(--color-text-muted)]"></div>}
                                </button>
                                <div>
                                    <h4 style={{ color: procedure.zeroEnergyVerification.tested ? 'var(--color-success)' : 'var(--color-text)' }} className="m-[0_0_0.5rem_0] text-[1.2rem] font-[900]">
                                        {procedure.zeroEnergyVerification.tested ? '¡Energía Cero Confirmada!' : 'Confirmar Estado de Energía Cero'}
                                    </h4>
                                    <p className="m-[0] text-[0.9rem] text-[var(--color-text-muted)]">
                                        Es obligatorio probar el arranque del equipo o medir la energía residual antes de iniciar cualquier trabajo.
                                    </p>
                                </div>
                            </div>
                            
                            <div style={{ paddingLeft: isMobile ? '0' : '5.5rem', opacity: procedure.zeroEnergyVerification.tested ? 1 : 0.5 }} className="transition-[opacity_0.3s]">
                                <label className="block mb-2 text-sm font-semibold text-slate-400">Método Utilizado para Verificación</label>
                                <select
                  value={procedure.zeroEnergyVerification.method}
                  onChange={(e) => setProcedure({ ...procedure, zeroEnergyVerification: { ...procedure.zeroEnergyVerification, method: e.target.value } })}
                  style={{ ...inputStyle, border: `1px solid ${procedure.zeroEnergyVerification.tested ? 'var(--color-success)' : 'var(--color-border)'}` }}
                  disabled={!procedure.zeroEnergyVerification.tested}>
                  
                                    <option value="try_start">Intento de Arranque Local (Pulsador)</option>
                                    <option value="tester">Medición con Instrumento (Multímetro/Tester)</option>
                                    <option value="gauge">Verificación de Presión (Manómetro a cero)</option>
                                    <option value="visual">Inspección Visual de Desconexión Física</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Instrucciones Paso a Paso / Observaciones</label>
                        <textarea
              value={procedure.observations}
              onChange={(e) => setProcedure({ ...procedure, observations: e.target.value })}
              style={{ ...inputStyle }}
              placeholder="1. Detener equipo... 2. Bloquear interruptor Q1... 3. Verificar energía cero..." className="min-h-[100px] pt-[0.75rem]" />
            
                    </div>

                    {/* Firmas y Autorizaciones */}
                    <div className="card animate-fade-in mt-[2.5rem] bg-[rgba(var(--color-surface-rgb),_0.3)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] p-[2.5rem] box-shadow-[0_8px_32px_0_rgba(0,_0,_0,_0.08)]">
                        <h3 className="mt-[0] mb-[2rem] flex items-center gap-[0.7rem] text-[var(--color-primary)] font-[900] text-[1.25rem] uppercase letter-spacing-[1.2px]">
                            <Pencil size={22} className="text-[var(--color-primary)]" /> Firmas y Autorizaciones LOTO
                        </h3>

                        {/* Custom visual switches */}
                        <div className="no-print mb-8 p-6 bg-[rgba(30,_41,_59,_0.2)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] w-[100%] flex flex-col gap-[1.25rem] justify-center items-center">
                            <div className="text-[var(--color-text)] font-[800] text-[0.85rem] uppercase letter-spacing-[0.5px]">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                            <div className="flex gap-[1rem] flex-wrap justify-center">
                                {[
                { id: 'operator', label: 'Personal Afectado' },
                { id: 'professional', label: 'Especialista Higiene y Seguridad' },
                { id: 'supervisor', label: 'Encargado Bloqueo' }].
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
                  ...procedure,
                  professionalSignature: professional.signature,
                  professionalName: professional.name,
                  professionalLicense: professional.license,
                  professionalStamp: professional.stamp
                }}
                box1={showSignatures.operator ? {
                  title: 'PERSONAL AFECTADO',
                  subtitle: 'Firma y Aclaración',
                  signatureUrl: procedure.operatorSignature || null,
                  isProfessional: false
                } : null}
                box2={showSignatures.professional ? {
                  title: 'PROFESIONAL H&S',
                  subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                  signatureUrl: procedure.professionalSignature || professional.signature || null,
                  stampUrl: procedure.professionalStamp || professional.stamp || null,
                  isProfessional: true,
                  license: professional.license
                } : null}
                box3={showSignatures.supervisor ? {
                  title: 'ENCARGADO BLOQUEO',
                  subtitle: 'Aprobación / Supervisor',
                  signatureUrl: procedure.supervisorSignature || procedure.signature || null,
                  isProfessional: false
                } : null} />
              
            <PdfBrandingFooter />
                        </div>

                        {/* Interactive Signature Drawing Pads */}
                        <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {showSignatures.operator &&
              <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas
                  onSave={(sig) => setProcedure((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                  initialImage={procedure.operatorSignature}
                  title="Firma de Personal Afectado" />
                
                                </div>
              }
                            
                            {showSignatures.professional &&
              <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas
                  onSave={(sig) => setProcedure((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                  initialImage={procedure.professionalSignature || professional.signature}
                  title="Firma de Especialista H&S" />
                
                                </div>
              }

                            {showSignatures.supervisor &&
              <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas
                  onSave={(sig) => setProcedure((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                  initialImage={procedure.supervisorSignature || procedure.signature}
                  title="Firma de Encargado Bloqueo" />
                
                                </div>
              }
                        </div>
                    </div>
                </div>

            </main>

            <div className="no-print floating-action-bar">
                <button
          onClick={() => requirePro(() => setShowShareModal(true))}
          className="btn-floating-action bg-[#0052CC] text-[#ffffff]">

          
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
          onClick={() => requirePro(() => window.print())}
          className="btn-floating-action bg-[#FF8B00] text-[#ffffff]">

          
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
                <button
          onClick={(e) => {e.preventDefault();requirePro(handleSave);}}
          className="btn-floating-action bg-[#36B37E] text-[#ffffff]">

          
                    <Save size={18} /> GUARDAR PROCEDIMIENTO
                </button>
            </div>

            <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Procedimiento LOTO"
        text={`Bloqueo y Etiquetado: ${procedure.equipmentName}`}
        rawMessage={`Bloqueo y Etiquetado: ${procedure.equipmentName}`}
        fileName={`LOTO_${procedure.equipmentName || 'Sin_Nombre'}.pdf`} />
      

            <div className="print-only fixed left-[0] opacity-[0.01] top-[0]">
                <LOTOPdf data={{ ...procedure, id: (procedure as any).id || Date.now().toString(), createdAt: (procedure as any).createdAt || new Date().toISOString() }} />
            </div>
        </div>);

}