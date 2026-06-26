import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, ShieldCheck, Weight, ArrowDownToLine, Users, Printer, Share2, Pencil, Search, Plus, Trash2, Calendar, CheckCircle2, FileText } from 'lucide-react';
import { Crane } from '@phosphor-icons/react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import PremiumHeader from '../components/PremiumHeader';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import LiftingPdfGenerator from '../components/LiftingPdfGenerator';
import ConfirmModal from '../components/ConfirmModal';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

const labelClass = "block mb-2 text-sm font-bold text-slate-200";
const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-base outline-none transition-all focus:border-emerald-500";
export default function LiftingForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const { isPro } = usePaywall();

  useDocumentTitle(isEdit ? 'Editar Plan de Izaje' : 'Planes de Izaje');

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  useEffect(() => {
    window.scrollTo(0, 0);
    const saved = JSON.parse(localStorage.getItem('lifting_plans_db') || '[]');
    setPlans(saved);
  }, [isFormVisible]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({ isOpen: true, payload: id });
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      const updated = plans.filter((p: any) => p.id !== confirmModal.payload);
      localStorage.setItem('lifting_plans_db', JSON.stringify(updated));
      setPlans(updated);
      toast.success('Registro eliminado');
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const filteredPlans = plans.filter((p: any) =>
  p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  p.personnel?.operator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  p.equipment?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [plan, setPlan] = useState<any>({
    location: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    equipment: 'Grua Movil',
    equipmentCapacity: '',
    loadWeight: '',
    maxRadius: '',
    windSpeed: '',
    riggingElements: {
      slings: false,
      shackles: false,
      spreaderBar: false,
      hooks: false
    },
    personnel: {
      operator: '',
      rigger: '',
      supervisor: ''
    },
    checklist: {
      groundStable: false,
      areaIsolated: false,
      weatherGood: false,
      powerLinesClear: false,
      elementsInspected: false
    },
    observations: '',
    signatures: {
      operator: '',
      supervisor: ''
    },
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
    setPlan((prev: any) => {
      const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
      return { ...prev, showSignatures: updated };
    });
  };

  const showSignatures = plan.showSignatures || { operator: true, professional: true, supervisor: true };

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
      setPlan({
        ...editData,
        operatorSignature: editData.operatorSignature || editData.signatures?.operator || '',
        professionalSignature: editData.professionalSignature || '',
        supervisorSignature: editData.supervisorSignature || editData.signatures?.supervisor || '',
        showSignatures: editData.showSignatures || { operator: true, professional: true, supervisor: true }
      });
      setIsEdit(true);
      setIsFormVisible(true);
    }
  }, [location.state]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const calculateLoadPercentage = () => {
    const load = parseFloat(plan.loadWeight);
    const capacity = parseFloat(plan.equipmentCapacity);
    if (isNaN(load) || isNaN(capacity) || capacity === 0) return 0;
    return (load / capacity * 100).toFixed(1);
  };

  const handleSave = () => {
    if (!plan.location || !plan.loadWeight || !plan.equipmentCapacity) {
      toast.error('Complete la Ubicación y los pesos de carga y capacidad');
      return;
    }

    const saved = JSON.parse(localStorage.getItem('lifting_plans_db') || '[]');
    let updated;

    const planWithSignatures = {
      ...plan,
      professionalSignature: plan.professionalSignature || professional.signature,
      professionalName: plan.professionalName || professional.name,
      professionalLicense: plan.professionalLicense || professional.license,
      professionalStamp: plan.professionalStamp || professional.stamp,
      signatures: {
        operator: plan.operatorSignature,
        supervisor: plan.supervisorSignature
      }
    };

    if (isEdit) {
      updated = saved.map((p: any) => p.id === (plan as any).id ? planWithSignatures : p);
      toast.success('Plan de Izaje actualizado');
    } else {
      const newPlan = {
        ...planWithSignatures,
        id: `LIFT-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      updated = [newPlan, ...saved];
      toast.success('Plan de Izaje guardado');
    }

    localStorage.setItem('lifting_plans_db', JSON.stringify(updated));

    setIsFormVisible(false);
    setIsEdit(false);
    setPlan({
      location: '', date: new Date().toISOString().split('T')[0], time: '',
      equipment: 'Grua Movil', equipmentCapacity: '', loadWeight: '', maxRadius: '', windSpeed: '',
      riggingElements: { slings: false, shackles: false, spreaderBar: false, hooks: false },
      personnel: { operator: '', rigger: '', supervisor: '' },
      checklist: { groundStable: false, areaIsolated: false, weatherGood: false, powerLinesClear: false, elementsInspected: false },
      observations: '', signatures: { operator: '', supervisor: '' },
      operatorSignature: '', professionalSignature: '', supervisorSignature: '',
      showSignatures: { operator: true, professional: true, supervisor: true }
    });
    window.scrollTo(0, 0);
  };

  const toggleChecklist = (key: string) => {
    setPlan((prev) => ({
      ...prev,
      checklist: { ...prev.checklist, [key]: !(prev.checklist as any)[key] }
    }));
  };

  const loadPercentage = calculateLoadPercentage();
  const isCritical = parseFloat(loadPercentage as string) >= 75;

  if (!isFormVisible && !isEdit) {
    return (
      <div className={`container min-h-screen bg-slate-950 pb-28 ${isMobile ? "pt-18" : "pt-22"}`}>
                <PremiumHeader onBack={isFormVisible ? () => {setIsFormVisible(false);} : undefined}
        title="Planes de Izaje"
        subtitle="Gestión e historial de planes de izaje seguro."
        icon={<Weight size={32} color="#ffffff" />}
        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
        
                
                <main className="p-[0_0_2rem_0] max-w-[1000px] m-[0_auto] w-[100%]">
                    {/* Botones de Navegación */}
                    <div className="flex gap-[1rem] p-[0_1rem] mb-[1rem]">
                        <></>
                    </div>

                    <div className="flex justify-space-between gap-[1rem] mb-[2rem] flex-wrap p-[0_1rem]">
                        <div className="relative flex-[1_1_300px]">
                            <Search size={20} className="absolute left-[1rem] top-[50%] transform-[translateY(-50%)] text-[var(--color-text-muted)]" />
                            <input
                type="text"
                placeholder="Buscar por ubicación o equipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} className="w-[100%] p-[0.8rem_1rem_0.8rem_2.8rem] rounded-[12px] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] box-sizing-[border-box]" />









              
                        </div>
                        <button
              onClick={() => setIsFormVisible(true)}
              className="btn-primary m-[0] bg-[#10b981] flex items-center gap-[0.5rem]">

              
                            <Plus size={20} /> NUEVO PLAN
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                        {filteredPlans.length === 0 ?
            <div className="grid-column-[1_/_-1] text-center p-[4rem_2rem] bg-[var(--color-surface)] rounded-[24px] border-[1px_dashed_var(--color-border)]">
                                <Weight size={48} className="text-[var(--color-text-light)] mb-[1rem]" />
                                <h3 className="m-[0_0_0.5rem_0]">No hay planes registrados</h3>
                                <p className="m-[0] text-[var(--color-text-muted)]">Cargue su primer plan de izaje.</p>
                            </div> :

            filteredPlans.map((item: any) => {
              const loadRatio = item.loadWeight && item.equipmentCapacity ?
              parseFloat(item.loadWeight) / parseFloat(item.equipmentCapacity) * 100 :
              0;
              const isCritical = loadRatio >= 75;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setPlan({ ...item, showSignatures: item.showSignatures || { operator: true, professional: true, supervisor: true } });
                    setIsEdit(true);
                    setIsFormVisible(true);
                  }}
                  className="card hover-lift animate-fade-in cursor-pointer p-6 rounded-2xl bg-slate-900 border border-slate-700">
                  
                                        <div className="flex justify-space-between items-start mb-[1rem]">
                                            <div>
                                                <h3 className="m-[0_0_0.25rem_0] text-[1.2rem] font-[900]">{item.location}</h3>
                                                <span className="text-[0.8rem] text-[var(--color-text-muted)] flex items-center gap-[0.25rem]">
                                                    <Calendar size={14} /> {new Date(item.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <span style={{
                      background: isCritical ? '#fef2f2' : '#f0fdf4',
                      color: isCritical ? '#dc2626' : '#16a34a'







                    }} className="p-[0.3rem_0.6rem] rounded-[6px] text-[0.75rem] font-[900] flex items-center gap-[0.25rem]">
                                                {isCritical ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                                                {isCritical ? 'CRÍTICO' : 'NORMAL'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex flex-col gap-[0.5rem] mb-[1.5rem]">
                                            <div className="flex justify-space-between text-[0.9rem]">
                                                <span className="text-[var(--color-text-muted)]">Equipo:</span>
                                                <span className="font-semibold">{item.equipment || '-'}</span>
                                            </div>
                                            <div className="flex justify-space-between text-[0.9rem]">
                                                <span className="text-[var(--color-text-muted)]">Carga:</span>
                                                <span className="font-semibold">{item.loadWeight ? `${item.loadWeight} kg` : '-'}</span>
                                            </div>
                                            <div className="flex justify-space-between text-[0.9rem]">
                                                <span className="text-[var(--color-text-muted)]">% Capacidad:</span>
                                                <span style={{ color: isCritical ? '#dc2626' : 'inherit' }} className="font-[600]">
                                                    {loadRatio ? `${loadRatio.toFixed(1)}%` : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-space-between items-center pt-[1rem] border-top-[1px_solid_var(--color-border)]">
                                            <span className="text-[0.8rem] text-[var(--color-primary)] font-[600] flex items-center gap-[0.25rem]">
                                                <FileText size={14} /> Ver / Editar
                                            </span>
                                            <button
                      onClick={(e) => handleDelete(item.id, e)}

                      title="Eliminar" className="bg-[transparent] border-none text-[#ef4444] cursor-pointer p-[0.5rem]">
                      
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>);

            })
            }
                    </div>
                </main>
                <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, payload: null })}
          onConfirm={executeDelete}
          title="¿Eliminar registro?"
          message="Esta acción no se puede deshacer."
          iconEmoji="🗑️" />
        
            </div>);

  }

  return (
    <div className={`min-h-screen bg-slate-950 pb-8 ${isMobile ? "pt-30" : "pt-26"}`}>
            <PremiumHeader onBack={isFormVisible ? () => {setIsFormVisible(false);} : undefined}
      title={isEdit ? 'Editar Plan de Izaje' : 'Nuevo Plan de Izaje'}
      subtitle="Complete la información del plan de izaje."
      icon={<Crane size={32} color="#ffffff" />}
      color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
      

            <main className="p-[3.5rem_1.5rem_1.5rem] max-w-[1000px] m-[0_auto]">
                <div className="mb-6">
                    <></>
                </div>
                <div className="card p-[2rem] bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border)]">
                    <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[1.5rem]">
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label className={labelClass}>Ubicación de la Maniobra *</label>
                            <input type="text" value={plan.location} onChange={(e) => setPlan({ ...plan, location: e.target.value })} className={inputClass} placeholder="Sector, Plataforma..." />
                        </div>
                        <div>
                            <label className={labelClass}>Fecha</label>
                            <input type="date" value={plan.date} onChange={(e) => setPlan({ ...plan, date: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Hora Estimada</label>
                            <input type="time" value={plan.time} onChange={(e) => setPlan({ ...plan, time: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Equipo a Utilizar</label>
                            <select value={plan.equipment} onChange={(e) => setPlan({ ...plan, equipment: e.target.value })} className={inputClass}>
                                <option value="Grua Movil">Grúa Móvil</option>
                                <option value="Grua Torre">Grúa Torre</option>
                                <option value="Puente Grua">Puente Grúa</option>
                                <option value="Autoelevador">Autoelevador</option>
                                <option value="Hidrogrúa">Hidrogrúa</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Velocidad Viento (km/h)</label>
                            <input type="number" value={plan.windSpeed} onChange={(e) => setPlan({ ...plan, windSpeed: e.target.value })} className={inputClass} placeholder="Máx 32 km/h" />
                        </div>
                    </div>

                    <div style={{ background: isCritical ? '#fef2f2' : 'var(--color-surface)', border: `1px solid ${isCritical ? '#fecaca' : 'var(--color-border)'}` }} className="mt-[2.5rem] p-[1.5rem] rounded-[12px]">
                        <h3 style={{ color: isCritical ? '#dc2626' : 'var(--color-primary)' }} className="m-[0_0_1rem_0] flex items-center gap-[0.5rem]">
                            <Weight size={20} /> Cálculos de Carga {isCritical && '(IZAJE CRÍTICO)'}
                        </h3>
                        <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr' }} className="grid gap-[1rem]">
                            <div>
                                <label className={labelClass}>Peso Total a Izar (kg) *</label>
                                <input type="number" value={plan.loadWeight} onChange={(e) => setPlan({ ...plan, loadWeight: e.target.value })} className={inputClass} placeholder="Incluye accesorios" />
                            </div>
                            <div>
                                <label className={labelClass}>Capacidad Bruta Grúa (kg) *</label>
                                <input type="number" value={plan.equipmentCapacity} onChange={(e) => setPlan({ ...plan, equipmentCapacity: e.target.value })} className={inputClass} placeholder="Capacidad a radio max" />
                            </div>
                            <div>
                                <label className={labelClass}>Porcentaje Capacidad</label>
                                <div style={{


                  background: isCritical ? '#dc2626' : '#16a34a'





                }} className="p-[0.75rem] rounded-[12px] text-[white] font-[900] text-[1.1rem] text-center mt-[0.2rem]">
                                    {loadPercentage}%
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="mt-[2.5rem] grid gap-[2rem]">
                        <div>
                            <h3 className="m-[0_0_1rem_0] text-[1.1rem] font-[800] text-[var(--color-primary)]">Personal Involucrado</h3>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className={labelClass}>Operador del Equipo</label>
                                    <input type="text" value={plan.personnel.operator} onChange={(e) => setPlan({ ...plan, personnel: { ...plan.personnel, operator: e.target.value } })} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Rigger / Señalero</label>
                                    <input type="text" value={plan.personnel.rigger} onChange={(e) => setPlan({ ...plan, personnel: { ...plan.personnel, rigger: e.target.value } })} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Supervisor a cargo</label>
                                    <input type="text" value={plan.personnel.supervisor} onChange={(e) => setPlan({ ...plan, personnel: { ...plan.personnel, supervisor: e.target.value } })} className={inputClass} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="m-[0_0_1rem_0] text-[1.1rem] font-[800] text-[var(--color-primary)]">Condiciones de Seguridad</h3>
                            <div className="flex flex-col gap-3">
                                {[
                { key: 'groundStable', label: 'Terreno Firme y Nivelado' },
                { key: 'areaIsolated', label: 'Área Delimitada y Señalizada' },
                { key: 'weatherGood', label: 'Condiciones Climáticas Favorables' },
                { key: 'powerLinesClear', label: 'Distancia de Líneas Eléctricas' },
                { key: 'elementsInspected', label: 'Elementos de Izaje Inspeccionados' }].
                map((item) =>
                <button
                  key={item.key}
                  onClick={() => toggleChecklist(item.key)}
                  style={{

                    background: (plan.checklist as any)[item.key] ? 'rgba(22, 163, 74, 0.1)' : 'var(--color-surface)',
                    border: `2px solid ${(plan.checklist as any)[item.key] ? '#16a34a' : 'var(--color-border)'}`






                  }} className="p-[0.75rem] rounded-[var(--radius-lg)] cursor-pointer flex items-center gap-[0.75rem] text-left">
                  
                                        <div style={{ background: (plan.checklist as any)[item.key] ? '#16a34a' : 'transparent' }} className="w-[20px] h-[20px] rounded-[6px] border-[2px_solid_#16a34a] flex items-center justify-center flex-shrink-[0]">
                                            {(plan.checklist as any)[item.key] && <ShieldCheck size={14} color="#fff" />}
                                        </div>
                                        <span className="text-[0.9rem] font-[600]">{item.label}</span>
                                    </button>
                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-[2.5rem]">
                        <label className={labelClass}>Observaciones Adicionales</label>
                        <textarea
              value={plan.observations}
              onChange={(e) => setPlan({ ...plan, observations: e.target.value })}
              className={`${inputClass} min-h-[100px]`}
              placeholder="Interferencias, maniobras complejas..." />
            
                    </div>

                    {/* Firmas y Autorizaciones */}
                    <div className="mt-[3rem]">
                        <div className="flex items-center gap-[0.75rem] mb-[1.5rem]">
                            <div className="bg-[rgba(56,_189,_248,_0.1)] p-[0.5rem] rounded-[8px]">
                                <Pencil size={24} color="#38bdf8" />
                            </div>
                            <h3 className="m-[0] text-[1.3rem] font-[800] text-[var(--color-primary)]">
                                Firmas y Autorizaciones del Plan
                            </h3>
                        </div>

                        {/* Signature Visibility Toggles (Pill style) */}
                        <div className="no-print mb-[2rem] p-[1.2rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] rounded-[16px] flex flex-col gap-[1rem] box-shadow-[0_4px_6px_rgba(0,0,0,0.02)]">









              
                            <div className="text-[var(--color-text)] text-[0.85rem] font-[800] uppercase letter-spacing-[0.5px]">
                                INCLUIR FIRMAS EN EL DOCUMENTO:
                            </div>
                            <div className="flex gap-[1rem] flex-wrap">
                                {[
                { id: 'operator', label: 'Operador', checked: showSignatures.operator },
                { id: 'professional', label: 'Especialista H&S', checked: showSignatures.professional },
                { id: 'supervisor', label: 'Supervisor de Izaje', checked: showSignatures.supervisor }].
                map((sig) =>
                <label key={sig.id} style={{





                  background: sig.checked ? 'rgba(56, 189, 248, 0.1)' : 'var(--color-background)',
                  border: `1px solid ${sig.checked ? '#38bdf8' : 'var(--color-border)'}`


                }} className="flex items-center gap-[0.5rem] cursor-pointer p-[0.5rem_1rem] rounded-[20px] transition-[all_0.2s_ease]">
                                        <div style={{

                    border: `2px solid ${sig.checked ? '#38bdf8' : 'var(--color-text-secondary)'}`,
                    background: sig.checked ? '#38bdf8' : 'transparent'

                  }} className="w-[18px] h-[18px] rounded-[4px] flex items-center justify-center">
                                            {sig.checked && <span className="text-[#fff] text-[12px] font-[bold]">✓</span>}
                                        </div>
                                        <input
                    type="checkbox"
                    checked={sig.checked}
                    onChange={(e) => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))} className="none" />

                   
                                        <span style={{ fontWeight: sig.checked ? 700 : 500, color: sig.checked ? 'var(--color-text)' : 'var(--color-text-secondary)' }} className="text-[0.9rem]">
                                            {sig.label}
                                        </span>
                                    </label>
                )}
                            </div>
                        </div>

                        {/* On-Sheet Visual Preview of PDF signature blocks */}
                        <div className="mb-[2.5rem]">
                            <PdfSignatures
                data={{
                  ...plan,
                  professionalSignature: professional.signature,
                  professionalName: professional.name,
                  professionalLicense: professional.license,
                  professionalStamp: professional.stamp
                }}
                box1={showSignatures.operator ? {
                  title: 'OPERADOR DEL EQUIPO',
                  subtitle: (plan.personnel?.operator || 'Firma del Operador').toUpperCase(),
                  signatureUrl: plan.operatorSignature || null,
                  isProfessional: false
                } : null}
                box2={showSignatures.professional ? {
                  title: 'PROFESIONAL H&S',
                  subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                  signatureUrl: plan.professionalSignature || professional.signature || null,
                  stampUrl: plan.professionalStamp || professional.stamp || null,
                  isProfessional: true,
                  license: professional.license
                } : null}
                box3={showSignatures.supervisor ? {
                  title: 'SUPERVISOR DE IZAJE',
                  subtitle: (plan.personnel?.supervisor || 'Firma del Supervisor').toUpperCase(),
                  signatureUrl: plan.supervisorSignature || null,
                  isProfessional: false
                } : null} />
              
            <PdfBrandingFooter />
                        </div>

                        {/* Interactive Signature Drawing Pads - Premium Glassmorphism */}
                        <div className="no-print grid grid-template-columns-[repeat(auto-fit,_minmax(300px,_1fr))] gap-[2rem] mt-[2rem]">




              
                            {showSignatures.operator &&
              <div className="animate-fade-in bg-[rgba(var(--color-surface-rgb),_0.3)] backdrop-filter-[blur(10px)] rounded-[16px] p-[1.5rem] border-[1px_solid_var(--glass-border)]">





                
                                    <div className="text-[0.85rem] font-[800] text-[var(--color-text-secondary)] mb-[1rem] uppercase letter-spacing-[0.5px]">
                                        Firma del Operador
                                    </div>
                                    <SignatureCanvas
                  onSave={(sig) => setPlan((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                  initialImage={plan.operatorSignature}
                  label="" />
                
                                </div>
              }
                            
                            {showSignatures.professional &&
              <div className="animate-fade-in bg-[rgba(var(--color-surface-rgb),_0.3)] backdrop-filter-[blur(10px)] rounded-[16px] p-[1.5rem] border-[1px_solid_var(--glass-border)]">





                
                                    <div className="text-[0.85rem] font-[800] text-[var(--color-text-secondary)] mb-[1rem] uppercase letter-spacing-[0.5px]">
                                        Firma de Especialista H&S
                                    </div>
                                    <SignatureCanvas
                  onSave={(sig) => setPlan((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                  initialImage={plan.professionalSignature || professional.signature}
                  label="" />
                
                                </div>
              }

                            {showSignatures.supervisor &&
              <div className="animate-fade-in bg-[rgba(var(--color-surface-rgb),_0.3)] backdrop-filter-[blur(10px)] rounded-[16px] p-[1.5rem] border-[1px_solid_var(--glass-border)]">





                
                                    <div className="text-[0.85rem] font-[800] text-[var(--color-text-secondary)] mb-[1rem] uppercase letter-spacing-[0.5px]">
                                        Firma del Supervisor
                                    </div>
                                    <SignatureCanvas
                  onSave={(sig) => setPlan((prev: any) => ({ ...prev, supervisorSignature: sig || '' }))}
                  initialImage={plan.supervisorSignature}
                  label="" />
                
                                </div>
              }
                        </div>
                    </div>
                </div>
            </main>

            <div className="no-print floating-action-bar">
                <button
          onClick={() => {setIsFormVisible(false);setIsEdit(false);}}
          className="btn-floating-action bg-[var(--color-surface)] text-[var(--color-text)] border-[1px_solid_var(--color-border)]">

          
                    <ArrowLeft size={18} /> ATRÁS
                </button>
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

          
                    <Save size={18} /> GUARDAR PLAN
                </button>
            </div>

            <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Plan de Izaje"
        text={`Plan de Izaje en ${plan.location}`}
        rawMessage={`Plan de Izaje en ${plan.location}`}
        fileName={`Izaje_${plan.location?.replace(/\s+/g, '_') || 'Nuevo'}.pdf`} />
      

            <div className="print-only fixed left-[0] opacity-[0.01] top-[0]">
                <LiftingPdfGenerator data={{
          ...plan,
          professionalSignature: plan.professionalSignature || professional.signature,
          professionalName: plan.professionalName || professional.name,
          professionalLicense: plan.professionalLicense || professional.license,
          professionalStamp: plan.professionalStamp || professional.stamp,
          signatures: {
            operator: plan.operatorSignature || plan.signatures?.operator || '',
            supervisor: plan.supervisorSignature || plan.signatures?.supervisor || ''
          }
        }} />
            </div>
        </div>);

}