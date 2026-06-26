import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, CarFront, AlertTriangle, ShieldCheck, Printer, Share2, ClipboardList, Wrench, FileText, Pencil } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import FleetPdfGenerator from '../components/FleetPdfGenerator';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

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

const CHECKLIST_ITEMS = [
{ category: 'DocumentaciÃ³n', id: 'docs_vtv', label: 'VTV / RTO Vigente' },
{ category: 'DocumentaciÃ³n', id: 'docs_insurance', label: 'Seguro Vigente' },
{ category: 'DocumentaciÃ³n', id: 'docs_license', label: 'Licencia Conducir OK' },

{ category: 'Exterior', id: 'ext_tires', label: 'Estado de NeumÃ¡ticos (Profundidad >1.6mm)' },
{ category: 'Exterior', id: 'ext_lights', label: 'Luces (Altas, Bajas, Giro, Freno, Retroceso)' },
{ category: 'Exterior', id: 'ext_mirrors', label: 'Espejos Retrovisores Sanos' },
{ category: 'Exterior', id: 'ext_windshield', label: 'Parabrisas sin roturas' },

{ category: 'Interior', id: 'int_seatbelts', label: 'Cinturones de Seguridad Funcionales' },
{ category: 'Interior', id: 'int_horn', label: 'Bocina / Alarma de Retroceso' },
{ category: 'Interior', id: 'int_wipers', label: 'Limpiaparabrisas y Sapito' },

{ category: 'Elementos de Seguridad', id: 'sec_extinguisher', label: 'Matafuego (Carga Vigente)' },
{ category: 'sec_cones', id: 'sec_cones', label: 'Balizas / Conos Reflectivos' },
{ category: 'sec_firstaid', id: 'sec_firstaid', label: 'BotiquÃ­n de Primeros Auxilios' }];


export default function FleetForm(): React.ReactElement | null {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const { isPro, requirePro } = usePaywall();

  useDocumentTitle(isEdit ? 'Editar InspecciÃ³n de VehÃ­culo' : 'Nueva InspecciÃ³n de VehÃ­culo');

  // Initialize checklist state with "ok" (others: "fail", "na")
  const initialChecklist = CHECKLIST_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: 'ok' }), {});

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
      toast.success('InspecciÃ³n actualizada');
    } else {
      const newForm = {
        ...formWithSignatures,
        id: `FLEET-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      updated = [newForm, ...saved];
      toast.success('InspecciÃ³n guardada');
    }

    localStorage.setItem('fleet_inspections_db', JSON.stringify(updated));
    navigate('/fleet-history');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-8 pt-24">
            <div className="bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 py-4 px-6 sticky z-[100] backdrop-blur-xl flex items-center gap-4" style={{ top: isMobile ? '6.5rem' : '5.5rem' }}>
                <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700">
          
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-[1]">
                    <h1 style={{ fontSize: isMobile ? '1.1rem' : '1.3rem' }} className="m-[0] font-[900]">
                        <CarFront size={20} className="display-[inline] mr-[0.5rem] vertical-align-[middle]" />
                        {isEdit ? 'Editar InspecciÃ³n Pre-Operacional' : 'InspecciÃ³n Pre-Operacional Vehicular'}
                    </h1>
                </div>
            </div>

            <main className="px-4 py-8 max-w-[1000px] mx-auto">
                <div className="card p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Dominio / Patente *</label>
                            <input type="text" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })} className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-extrabold uppercase focus:ring-2 focus:ring-blue-500 outline-none" placeholder="AB 123 CD" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Tipo de VehÃ­culo</label>
                            <select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="Camioneta">Camioneta / Pick-up</option>
                                <option value="AutomÃ³vil">AutomÃ³vil Liviano</option>
                                <option value="CamiÃ³n">CamiÃ³n</option>
                                <option value="Autoelevador">Autoelevador</option>
                                <option value="Maquinaria">Maquinaria Vial</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Marca y Modelo</label>
                            <input type="text" value={form.brandModel} onChange={(e) => setForm({ ...form, brandModel: e.target.value })} className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Toyota Hilux" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Kilometraje / HorÃ³metro</label>
                            <input type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: 120500" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Conductor Asignado *</label>
                            <input type="text" value={form.driver} onChange={(e) => setForm({ ...form, driver: e.target.value })} className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Fecha de InspecciÃ³n</label>
                            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`mt-8 p-4 rounded-xl border-2 flex justify-between items-center ${form.status === 'Apto' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                        <div>
                            <h3 style={{ color: form.status === 'Apto' ? '#166534' : '#991b1b' }} className="m-[0_0_0.2rem_0]">Estado del VehÃ­culo</h3>
                            <p style={{ color: form.status === 'Apto' ? '#15803d' : '#b91c1c' }} className="m-[0] text-[0.8rem]">Basado en el checklist</p>
                        </div>
                        <div className={`py-2 px-6 text-white font-black rounded-full text-xl ${form.status === 'Apto' ? 'bg-green-600' : 'bg-red-600'}`}>
                            {form.status.toUpperCase()}
                        </div>
                    </div>

                    <div className="mt-[2.5rem]">
                        <h3 className="flex items-center gap-2 mb-4 text-xl font-extrabold text-blue-600 dark:text-blue-400">
                            <ClipboardList size={22} /> Checklist Pre-Operacional
                        </h3>
                        
                        <div className="flex flex-col gap-3">
                            {CHECKLIST_ITEMS.map((item, index) =>
              <div key={item.id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex-wrap gap-4">
                                    <div className="flex-[1_1_200px]">
                                        <span className="text-[0.9rem] font-[600]">{item.label}</span>
                                    </div>
                                    <div className="checklist-status-buttons min-width-[180px]">
                                        <button
                    type="button"
                    onClick={() => updateChecklist(item.id, 'ok')}
                    className={`status-btn ${form.checklist?.[item.id] === 'ok' ? 'active-ok' : ''}`}>
                    
                                            OK
                                        </button>
                                        <button
                    type="button"
                    onClick={() => updateChecklist(item.id, 'fail')}
                    className={`status-btn ${form.checklist?.[item.id] === 'fail' ? 'active-fail' : ''}`}>
                    
                                            FALLA
                                        </button>
                                        <button
                    type="button"
                    onClick={() => updateChecklist(item.id, 'na')}
                    className={`status-btn ${form.checklist?.[item.id] === 'na' ? 'active-na' : ''}`}>
                    
                                            N/A
                                        </button>
                                    </div>
                                </div>
              )}
                        </div>
                    </div>

                    <div className="mt-[2.5rem]">
                        <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Observaciones Generales / Novedades</label>
                        <textarea
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] resize-y"
              placeholder="Ej: RayÃ³n en guardabarros derecho. PrÃ³ximo service en 1000 km..." />
            
                    </div>

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

                        {/* Signature Visibility Toggles (Pill style) */}
                        <div className="no-print mb-[2rem] p-[1.2rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] rounded-[16px] flex flex-col gap-[1rem] box-shadow-[0_4px_6px_rgba(0,0,0,0.02)]">









              
                            <div className="text-[var(--color-text)] text-[0.85rem] font-[800] uppercase letter-spacing-[0.5px]">
                                INCLUIR FIRMAS EN EL DOCUMENTO:
                            </div>
                            <div className="flex gap-[1rem] flex-wrap">
                                {[
                { id: 'operator', label: 'Conductor', checked: showSignatures.operator },
                { id: 'professional', label: 'Especialista H&S', checked: showSignatures.professional },
                { id: 'supervisor', label: 'Inspector / Control', checked: showSignatures.supervisor }].
                map((sig) =>
                <label key={sig.id} style={{





                  background: sig.checked ? 'rgba(56, 189, 248, 0.1)' : 'var(--color-background)',
                  border: `1px solid ${sig.checked ? '#38bdf8' : 'var(--color-border)'}`


                }} className="flex items-center gap-[0.5rem] cursor-pointer p-[0.5rem_1rem] rounded-[20px] transition-[all_0.2s_ease]">
                                        <div style={{

                    border: `2px solid ${sig.checked ? '#38bdf8' : 'var(--color-text-secondary)'}`,
                    background: sig.checked ? '#38bdf8' : 'transparent'

                  }} className="w-[18px] h-[18px] rounded-[4px] flex items-center justify-center">
                                            {sig.checked && <span className="text-[#fff] text-[12px] font-[bold]">âœ“</span>}
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
                </div>
            </main>

            <div className="no-print floating-action-bar">
                <button
          onClick={() => requirePro(() => setShowShareModal(true))}
          className="btn-floating-action bg-blue-600 hover:bg-blue-700 text-white">
          
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
          onClick={() => requirePro(() => window.print())}
          className="btn-floating-action bg-orange-500 hover:bg-orange-600 text-white">
          
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
                <button
          onClick={handleSave}
          className="btn-floating-action bg-emerald-500 hover:bg-emerald-600 text-white">
          
                    <Save size={18} /> GUARDAR
                </button>
            </div>

            <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="InspecciÃ³n Vehicular"
        text={`InspecciÃ³n VehÃ­culo ${form.plate} - Estado: ${form.status}`}
        rawMessage={`InspecciÃ³n VehÃ­culo ${form.plate} - Estado: ${form.status}`}
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