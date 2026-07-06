import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, CarFront, AlertTriangle, ShieldCheck, Printer, Share2, ClipboardList, Wrench, FileText, Pencil, Search, Plus, Trash2, Calendar, CheckCircle2 } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import PremiumHeader from '../components/PremiumHeader';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import FleetPdfGenerator from '../components/FleetPdfGenerator';
import ConfirmModal from '../components/ConfirmModal';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { ModuleFormLayout, ModuleFormDocument, ModuleFormSection, ModuleActionBar } from '../components/module';

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.5rem',
  fontSize: '0.9rem',
  fontWeight: 700,
  color: 'var(--color-text)'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem 1.2rem',
  borderRadius: '14px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.03)',
  color: 'var(--color-text)',
  fontSize: '0.95rem',
  fontWeight: 500,
  outline: 'none',
  boxSizing: 'border-box' as any,
  transition: 'all 0.3s ease',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
};

const CHECKLIST_ITEMS = [
{ category: 'Documentación', id: 'docs_vtv', label: 'VTV / RTO Vigente' },
{ category: 'Documentación', id: 'docs_insurance', label: 'Seguro Vigente' },
{ category: 'Documentación', id: 'docs_license', label: 'Licencia Conducir OK' },

{ category: 'Exterior', id: 'ext_tires', label: 'Estado de Neumáticos (Profundidad >1.6mm)' },
{ category: 'Exterior', id: 'ext_lights', label: 'Luces (Altas, Bajas, Giro, Freno, Retroceso)' },
{ category: 'Exterior', id: 'ext_mirrors', label: 'Espejos Retrovisores Sanos' },
{ category: 'Exterior', id: 'ext_windshield', label: 'Parabrisas sin roturas' },

{ category: 'Interior', id: 'int_seatbelts', label: 'Cinturones de Seguridad Funcionales' },
{ category: 'Interior', id: 'int_horn', label: 'Bocina / Alarma de Retroceso' },
{ category: 'Interior', id: 'int_wipers', label: 'Limpiaparabrisas y Sapito' },

{ category: 'Elementos de Seguridad', id: 'sec_extinguisher', label: 'Matafuego (Carga Vigente)' },
{ category: 'sec_cones', id: 'sec_cones', label: 'Balizas / Conos Reflectivos' },
{ category: 'sec_firstaid', id: 'sec_firstaid', label: 'Botiquín de Primeros Auxilios' }];


export default function FleetForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const { isPro } = usePaywall();

  useDocumentTitle(isEdit ? 'Editar Inspección de Vehículo' : 'Control de Flota');

  // Initialize checklist state with "ok" (others: "fail", "na")
  const initialChecklist = CHECKLIST_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: 'ok' }), {});

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inspections, setInspections] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('fleet_inspections_db') || '[]');
    setInspections(saved);
  }, [isFormVisible]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({ isOpen: true, payload: id });
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      const updated = inspections.filter((p: any) => p.id !== confirmModal.payload);
      localStorage.setItem('fleet_inspections_db', JSON.stringify(updated));
      setInspections(updated);
      toast.success('Registro eliminado');
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const filteredInspections = inspections.filter((p: any) =>
  p.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  p.driver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  p.brandModel?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [form, setForm] = useState<any>({
    vehicleId: '',
    vehicleType: 'Camioneta',
    brandModel: '',
    plate: '',
    mileage: '',
    date: new Date().toISOString().split('T')[0],
    driver: '',
    inspector: '',
    checklist: initialChecklist,
    observations: '',
    status: 'Apto',
    signatures: {
      driver: '',
      inspector: ''
    },
    driverSignature: '',
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
    setForm((prev: any) => {
      const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
      return { ...prev, showSignatures: updated };
    });
  };

  const showSignatures = form.showSignatures || { operator: true, professional: true, supervisor: true };

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
      setForm({
        ...editData,
        driverSignature: editData.driverSignature || editData.signatures?.driver || '',
        professionalSignature: editData.professionalSignature || '',
        supervisorSignature: editData.supervisorSignature || editData.signatures?.inspector || '',
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

  const updateChecklist = (id: string, value: string) => {
    setForm((prev) => {
      const newChecklist = { ...prev.checklist, [id]: value };
      const hasFailures = Object.values(newChecklist).some((val) => val === 'fail');
      return {
        ...prev,
        checklist: newChecklist,
        status: hasFailures ? 'No Apto' : 'Apto'
      };
    });
  };

  const handleSave = () => {
    if (!form.plate || !form.driver) {
      toast.error('Complete la Patente y el Conductor');
      return;
    }

    const saved = JSON.parse(localStorage.getItem('fleet_inspections_db') || '[]');
    let updated;

    const formWithSignatures = {
      ...form,
      professionalSignature: form.professionalSignature || professional.signature,
      professionalName: form.professionalName || professional.name,
      professionalLicense: form.professionalLicense || professional.license,
      professionalStamp: form.professionalStamp || professional.stamp,
      signatures: {
        driver: form.driverSignature,
        inspector: form.supervisorSignature
      }
    };

    if (isEdit) {
      updated = saved.map((p: any) => p.id === (form as any).id ? formWithSignatures : p);
      toast.success('Inspección actualizada');
    } else {
      const newForm = {
        ...formWithSignatures,
        id: `FLEET-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      updated = [newForm, ...saved];
      toast.success('Inspección guardada');
    }

    localStorage.setItem('fleet_inspections_db', JSON.stringify(updated));

    setIsFormVisible(false);
    setIsEdit(false);
    setForm({
      vehicleId: '', vehicleType: 'Camioneta', brandModel: '', plate: '', mileage: '',
      date: new Date().toISOString().split('T')[0], driver: '', inspector: '',
      checklist: initialChecklist, observations: '', status: 'Apto',
      signatures: { driver: '', inspector: '' }, driverSignature: '', professionalSignature: '', supervisorSignature: '',
      showSignatures: { operator: true, professional: true, supervisor: true }
    });
    window.scrollTo(0, 0);
  };

  if (!isFormVisible && !isEdit) {
    return (
      <div className="container min-h-screen bg-slate-50 dark:bg-slate-900 pb-28 pt-20">
                <PremiumHeader onBack={isFormVisible ? () => {setIsFormVisible(false);} : undefined}
        title="Control de Flota y Vehículos"
        subtitle="Gestión e historial de inspecciones pre-operacionales."
        icon={<CarFront size={32} color="#ffffff" />}
        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
        
                
                <main className="pb-8 max-w-[1000px] mx-auto w-full">
                    {/* Botones de Navegación */}
                    <div className="flex gap-[1rem] p-[0_1rem] mb-[1rem]">
                        <></>
                    </div>

                    <div className="flex flex-col gap-4 mb-[2rem] px-4">
                        <div className="flex justify-end">
                            <button
                  onClick={() => setIsFormVisible(true)}
                  onMouseOver={(e) => {e.currentTarget.style.transform = 'translateY(-2px)';e.currentTarget.style.boxShadow = '0 12px 25px rgba(16,185,129,0.4)';}}
                  onMouseOut={(e) => {e.currentTarget.style.transform = 'none';e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,185,129,0.3)';}}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0 1.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', fontWeight: 800, borderRadius: '1rem', border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(16,185,129,0.3)', whiteSpace: 'nowrap', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', minHeight: '3.5rem' }}>
                                <Plus size={22} strokeWidth={2.5} /> Nueva Inspección
                            </button>
                        </div>
                        <div className="relative w-full">
                            <Search size={22} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                type="text"
                placeholder="Buscar por patente o conductor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={(e) => {e.currentTarget.style.border = '2px solid #3b82f6';e.currentTarget.style.backgroundColor = 'transparent';e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.1)';}}
                onBlur={(e) => {e.currentTarget.style.border = '2px solid transparent';e.currentTarget.style.backgroundColor = 'transparent';e.currentTarget.style.boxShadow = 'none';}}
                style={{ width: '100%', height: '100%', minHeight: '3.5rem', padding: '0.75rem 1rem 0.75rem 3.5rem', borderRadius: '1rem', border: '2px solid transparent', backgroundColor: 'rgba(241, 245, 249, 0.5)', fontSize: '1rem', outline: 'none', transition: 'all 0.3s', fontWeight: 500, color: 'var(--color-text)' }} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                        {filteredInspections.length === 0 ?
            <div className="grid-column-[1_/_-1] text-center p-[4rem_2rem] bg-[var(--color-surface)] rounded-[24px] border-[1px_dashed_var(--color-border)]">
                                <CarFront size={48} className="text-[var(--color-text-light)] mb-[1rem]" />
                                <h3 className="m-[0_0_0.5rem_0]">No hay inspecciones registradas</h3>
                                <p className="m-[0] text-[var(--color-text-muted)]">Cargue la primera inspección pre-operacional.</p>
                            </div> :

            filteredInspections.map((item: any) => {
              const isApto = item.status === 'Apto';
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setForm({ ...item, showSignatures: item.showSignatures || { operator: true, professional: true, supervisor: true } });
                    setIsEdit(true);
                    setIsFormVisible(true);
                  }}
                  className="card hover-lift animate-fade-in cursor-pointer p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                  
                                        <div className="flex justify-space-between items-start mb-[1rem]">
                                            <div>
                                                <h3 className="m-[0_0_0.25rem_0] text-[1.2rem] font-[900] uppercase">{item.plate}</h3>
                                                <span className="text-[0.8rem] text-[var(--color-text-muted)] flex items-center gap-[0.25rem]">
                                                    <Calendar size={14} /> {new Date(item.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <span style={{
                      background: isApto ? '#f0fdf4' : '#fef2f2',
                      color: isApto ? '#16a34a' : '#dc2626'







                    }} className="p-[0.3rem_0.6rem] rounded-[6px] text-[0.75rem] font-[900] flex items-center gap-[0.25rem]">
                                                {isApto ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                                {item.status?.toUpperCase() || 'N/A'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex flex-col gap-[0.5rem] mb-[1.5rem]">
                                            <div className="flex justify-space-between text-[0.9rem]">
                                                <span className="text-[var(--color-text-muted)]">Modelo:</span>
                                                <span className="font-[600]">{item.brandModel || '-'}</span>
                                            </div>
                                            <div className="flex justify-space-between text-[0.9rem]">
                                                <span className="text-[var(--color-text-muted)]">Conductor:</span>
                                                <span className="font-[600]">{item.driver}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-[0.5rem] pt-[1rem] border-top-[1px_solid_var(--color-border)]">
                                            <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setForm({ ...item, showSignatures: item.showSignatures || { operator: true, professional: true, supervisor: true } });
                                                  setIsEdit(true);
                                                  setIsFormVisible(true);
                                                }}
                                                style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none' }}
                                                className="flex-1 sm:flex-none p-[0.5rem_1rem] rounded-[8px] text-[0.85rem] font-[800] flex items-center justify-center gap-[0.4rem] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform"
                                            >
                                                <FileText size={16} /> Ver / Editar
                                            </button>
                                            <button
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Eliminar"
                      style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }}
                      className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform flex items-center justify-center">
                                                <Trash2 size={16} />
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-8 pt-24">
            <PremiumHeader onBack={isFormVisible ? () => {setIsFormVisible(false);} : undefined}
      title={isEdit ? 'Editar Inspección' : 'Nueva Inspección Vehicular'}
      subtitle="Complete el checklist pre-operacional para autorizar el uso del vehículo."
      icon={<CarFront size={32} color="#ffffff" />}
      color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
      

            <main className="px-4 py-8 max-w-[1000px] mx-auto">
                <ModuleFormLayout maxWidth={1000}>
                <ModuleFormDocument>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Dominio / Patente *</label>
                            <input type="text" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })} className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-extrabold uppercase focus:ring-2 focus:ring-blue-500 outline-none" placeholder="AB 123 CD" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Tipo de Vehículo</label>
                            <select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="Camioneta">Camioneta / Pick-up</option>
                                <option value="Automóvil">Automóvil Liviano</option>
                                <option value="Camión">Camión</option>
                                <option value="Autoelevador">Autoelevador</option>
                                <option value="Maquinaria">Maquinaria Vial</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Marca y Modelo</label>
                            <input type="text" value={form.brandModel} onChange={(e) => setForm({ ...form, brandModel: e.target.value })} className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Toyota Hilux" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Kilometraje / Horómetro</label>
                            <input type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: 120500" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Conductor Asignado *</label>
                            <input type="text" value={form.driver} onChange={(e) => setForm({ ...form, driver: e.target.value })} className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Fecha de Inspección</label>
                            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`mt-8 p-4 rounded-xl border-2 flex justify-between items-center ${form.status === 'Apto' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                        <div>
                            <h3 style={{ color: form.status === 'Apto' ? '#166534' : '#991b1b' }} className="m-[0_0_0.2rem_0]">Estado del Vehículo</h3>
                            <p style={{ color: form.status === 'Apto' ? '#15803d' : '#b91c1c' }} className="m-[0] text-[0.8rem]">Basado en el checklist</p>
                        </div>
                        <div className={`py-2 px-6 text-white font-black rounded-full text-xl ${form.status === 'Apto' ? 'bg-green-600' : 'bg-red-600'}`}>
                            {form.status.toUpperCase()}
                        </div>
                    </div>

                    <ModuleFormSection title="Checklist Pre-Operacional" icon={<ClipboardList size={22} />}>
                        <div className="flex flex-col gap-4">
                            {CHECKLIST_ITEMS.map((item, index) =>
              <div key={item.id} className="hover-lift flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex-wrap gap-4 transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <div className="flex-[1_1_200px] flex items-center gap-[0.8rem]">
                                        <div className="w-[8px] h-[8px] rounded-[50%] bg-[var(--color-primary)]"></div>
                                        <span className="text-[0.95rem] font-[600] text-[var(--color-text)]">{item.label}</span>
                                    </div>
                                    <div className="flex gap-[0.5rem] flex-wrap flex-[1_1_auto] justify-end">
                                        <button
                    type="button"
                    onClick={() => updateChecklist(item.id, 'ok')}
                    style={{
                      border: form.checklist?.[item.id] === 'ok' ? 'none' : '1px solid var(--color-border)',
                      background: form.checklist?.[item.id] === 'ok' ? '#10b981' : 'var(--color-surface)',
                      color: form.checklist?.[item.id] === 'ok' ? 'white' : 'var(--color-text)'

                    }} className="p-[0.6rem_1rem] rounded-[8px] cursor-pointer font-[800] text-[0.8rem] flex-[1_1_auto] text-center min-width-[70px] transition-[all_0.2s]">
                    
                                            OK
                                        </button>
                                        <button
                    type="button"
                    onClick={() => updateChecklist(item.id, 'fail')}
                    style={{
                      border: form.checklist?.[item.id] === 'fail' ? 'none' : '1px solid var(--color-border)',
                      background: form.checklist?.[item.id] === 'fail' ? '#ef4444' : 'var(--color-surface)',
                      color: form.checklist?.[item.id] === 'fail' ? 'white' : 'var(--color-text)'

                    }} className="p-[0.6rem_1rem] rounded-[8px] cursor-pointer font-[800] text-[0.8rem] flex-[1_1_auto] text-center min-width-[70px] transition-[all_0.2s]">
                    
                                            FALLA
                                        </button>
                                        <button
                    type="button"
                    onClick={() => updateChecklist(item.id, 'na')}
                    style={{
                      border: form.checklist?.[item.id] === 'na' ? 'none' : '1px solid var(--color-border)',
                      background: form.checklist?.[item.id] === 'na' ? '#6b7280' : 'var(--color-surface)',
                      color: form.checklist?.[item.id] === 'na' ? 'white' : 'var(--color-text)'

                    }} className="p-[0.6rem_1rem] rounded-[8px] cursor-pointer font-[800] text-[0.8rem] flex-[1_1_auto] text-center min-width-[70px] transition-[all_0.2s]">
                    
                                            N/A
                                        </button>
                                    </div>
                                </div>
              )}
                        </div>
                      <div className="mt-[2.5rem]">
                        <label style={{ ...labelStyle }} className="text-[var(--color-primary)] text-[1.1rem] flex items-center gap-[0.5rem] mb-[1rem]">
                            <FileText size={20} /> Observaciones Generales / Novedades
                        </label>
                        <textarea
                value={form.observations}
                onChange={(e) => setForm({ ...form, observations: e.target.value })}
                className="w-full p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-base font-medium focus:ring-2 focus:ring-blue-500 outline-none min-h-[140px] resize-y"
                placeholder="Describa cualquier novedad, daño o elemento faltante..." />
              
                    </div>
                    </ModuleFormSection>

                    {/* Firmas y Autorizaciones */}
                    <div className="mt-[3rem]">
                        <div className="flex items-center gap-[0.75rem] mb-[1.5rem]">
                            <div className="bg-[rgba(56,_189,_248,_0.1)] p-[0.5rem] rounded-[8px]">
                                <Pencil size={24} color="#38bdf8" />
                            </div>
                            <h3 className="m-[0] text-[1.3rem] font-[800] text-[var(--color-primary)]">
                                Firmas y Autorizaciones del Permiso
                            </h3>
                        </div>

                        {/* Signature Visibility Toggles */}
                        <div className="no-print mb-8 p-6 bg-[rgba(30,_41,_59,_0.02)] border-[1px_solid_var(--color-border)] rounded-[24px] w-[100%] flex flex-col gap-[1.25rem] justify-center items-center box-shadow-[0_4px_6px_rgba(0,0,0,0.02)]">
                            <div className="text-[var(--color-text)] font-[800] text-[0.85rem] uppercase letter-spacing-[0.5px]">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                            <div className="flex gap-[1rem] flex-wrap justify-center">
                                {[
                  { id: 'operator', label: 'Conductor' },
                  { id: 'professional', label: 'Especialista H&S' },
                  { id: 'supervisor', label: 'Inspector / Control' }].
                  map((sig) => {
                    const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                    return (
                      <label
                        key={sig.id}
                        className="flex items-center gap-2 cursor-pointer select-none p-[0.55rem_1.1rem] rounded-[24px] font-[750] text-[0.85rem] transition-[all_0.2s_ease] whitespace-nowrap"
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
                        }} className="w-[18px] h-[18px] rounded-[4px] flex items-center justify-center transition-[all_0.2s_ease]">
                                                {isChecked && <CheckCircle2 size={12} color="white" strokeWidth={3} />}
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
                  ...form,
                  professionalSignature: professional.signature,
                  professionalName: professional.name,
                  professionalLicense: professional.license,
                  professionalStamp: professional.stamp
                }}
                box1={showSignatures.operator ? {
                  title: 'CONDUCTOR ASIGNADO',
                  subtitle: (form.driver || 'Firma del Conductor').toUpperCase(),
                  signatureUrl: form.driverSignature || null,
                  isProfessional: false
                } : null}
                box2={showSignatures.professional ? {
                  title: 'PROFESIONAL H&S',
                  subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                  signatureUrl: form.professionalSignature || professional.signature || null,
                  stampUrl: form.professionalStamp || professional.stamp || null,
                  isProfessional: true,
                  license: professional.license
                } : null}
                box3={showSignatures.supervisor ? {
                  title: 'INSPECTOR / CONTROL',
                  subtitle: (form.inspector || 'Firma del Inspector').toUpperCase(),
                  signatureUrl: form.supervisorSignature || null,
                  isProfessional: false
                } : null} />
              
            <PdfBrandingFooter />
                        </div>

                        {/* Interactive Signature Drawing Pads - Premium Glassmorphism */}
                        <div className="no-print grid grid-template-columns-[repeat(auto-fit,_minmax(300px,_1fr))] gap-[2rem] mt-[2rem]">




              
                            {showSignatures.operator &&
              <div className="animate-fade-in bg-[rgba(var(--color-surface-rgb),_0.3)] backdrop-filter-[blur(10px)] rounded-[16px] p-[1.5rem] border-[1px_solid_var(--glass-border)]">





                
                                    <div className="text-[0.85rem] font-[800] text-[var(--color-text-secondary)] mb-[1rem] uppercase letter-spacing-[0.5px]">
                                        Firma del Conductor
                                    </div>
                                    <SignatureCanvas
                  onSave={(sig) => setForm((prev: any) => ({ ...prev, driverSignature: sig || '' }))}
                  initialImage={form.driverSignature}
                  label="" />
                
                                </div>
              }
                            
                            {showSignatures.professional &&
              <div className="animate-fade-in bg-[rgba(var(--color-surface-rgb),_0.3)] backdrop-filter-[blur(10px)] rounded-[16px] p-[1.5rem] border-[1px_solid_var(--glass-border)]">





                
                                    <div className="text-[0.85rem] font-[800] text-[var(--color-text-secondary)] mb-[1rem] uppercase letter-spacing-[0.5px]">
                                        Firma de Especialista H&S
                                    </div>
                                    <SignatureCanvas
                  onSave={(sig) => setForm((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                  initialImage={form.professionalSignature || professional.signature}
                  label="" />
                
                                </div>
              }

                            {showSignatures.supervisor &&
              <div className="animate-fade-in bg-[rgba(var(--color-surface-rgb),_0.3)] backdrop-filter-[blur(10px)] rounded-[16px] p-[1.5rem] border-[1px_solid_var(--glass-border)]">





                
                                    <div className="text-[0.85rem] font-[800] text-[var(--color-text-secondary)] mb-[1rem] uppercase letter-spacing-[0.5px]">
                                        Firma del Inspector
                                    </div>
                                    <SignatureCanvas
                  onSave={(sig) => setForm((prev: any) => ({ ...prev, supervisorSignature: sig || '' }))}
                  initialImage={form.supervisorSignature}
                  label="" />
                
                                </div>
              }
                        </div>
                    </div>
                </ModuleFormDocument>
                </ModuleFormLayout>
            </main>

            <ModuleActionBar
              actions={[
                {
                  id: 'share',
                  label: 'COMPARTIR',
                  icon: <Share2 size={18} />,
                  variant: 'info',
                  onClick: () => requirePro(() => setShowShareModal(true)),
                },
                {
                  id: 'print',
                  label: 'IMPRIMIR PDF',
                  icon: <Printer size={18} />,
                  variant: 'warning',
                  onClick: () => requirePro(() => window.print()),
                },
                {
                  id: 'save',
                  label: 'GUARDAR',
                  icon: <Save size={18} />,
                  variant: 'primary',
                  onClick: (e) => { e.preventDefault(); requirePro(handleSave); },
                },
              ]}
            />

            <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Inspección Vehicular"
        text={`Inspección Vehículo ${form.plate} - Estado: ${form.status}`}
        rawMessage={`Inspección Vehículo ${form.plate} - Estado: ${form.status}`}
        fileName={`Vehiculo_${form.plate || 'Nuevo'}.pdf`} />
      

            <div className="print-only fixed left-[0] opacity-[0.01] top-[0]">
                <FleetPdfGenerator data={{
          ...form,
          professionalSignature: form.professionalSignature || professional.signature,
          professionalName: form.professionalName || professional.name,
          professionalLicense: form.professionalLicense || professional.license,
          professionalStamp: form.professionalStamp || professional.stamp,
          signatures: {
            driver: form.driverSignature || form.signatures?.driver || '',
            inspector: form.supervisorSignature || form.signatures?.inspector || ''
          }
        }} checklistItems={CHECKLIST_ITEMS} />
            </div>
        </div>);

}