import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Users, Target, ShieldCheck, Printer, Share2, Timer, Pencil, Building2, Search } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import PremiumHeader from '../components/PremiumHeader';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import EvacuationPdfGenerator from '../components/EvacuationPdfGenerator';
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

export default function EvacuationSimulatorForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useDocumentTitle(isEdit ? 'Editar Simulador de Evacuación' : 'Simulador de Evacuación');

  const [form, setForm] = useState<any>({
    sector: '',
    date: new Date().toISOString().split('T')[0],
    evaluator: '',

    // Variables de cálculo
    peopleCount: 50,
    exitWidth: 1.2, // in meters
    maxDistance: 30, // in meters
    walkingSpeed: 1.2, // m/s
    specificFlow: 1.3, // people / (meter * second)

    observations: '',
    signatures: {
      evaluator: '',
      manager: ''
    },
    evaluatorSignature: '',
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
    window.scrollTo(0, 0);
    if (location.state?.editData) {
      const editData = location.state.editData;
      setForm({
        ...editData,
        evaluatorSignature: editData.evaluatorSignature || editData.signatures?.evaluator || '',
        professionalSignature: editData.professionalSignature || '',
        supervisorSignature: editData.supervisorSignature || editData.signatures?.manager || '',
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

  const calculateEvacuationTime = () => {
    const { peopleCount, exitWidth, maxDistance, walkingSpeed, specificFlow } = form;
    if (!exitWidth || !walkingSpeed || !specificFlow) return { flowTime: 0, travelTime: 0, total: 0 };

    // Tiempo de flujo (pasar por la puerta)
    const flowTime = peopleCount / (exitWidth * specificFlow);

    // Tiempo de viaje (caminar hasta la salida)
    const travelTime = maxDistance / walkingSpeed;

    // El tiempo total es la suma teórica básica
    const total = flowTime + travelTime;

    return {
      flowTime: flowTime.toFixed(1),
      travelTime: travelTime.toFixed(1),
      total: total.toFixed(1)
    };
  };

  const results = calculateEvacuationTime();

  const handleSave = () => {
    if (!form.sector || !form.evaluator) {
      toast.error('Complete el Sector y el Evaluador');
      return;
    }

    const saved = JSON.parse(localStorage.getItem('evacuation_simulator_db') || '[]');
    let updated;

    const dataToSave = {
      ...form,
      calculatedTime: results.total,
      professionalSignature: form.professionalSignature || professional.signature,
      professionalName: form.professionalName || professional.name,
      professionalLicense: form.professionalLicense || professional.license,
      professionalStamp: form.professionalStamp || professional.stamp,
      signatures: {
        evaluator: form.evaluatorSignature,
        manager: form.supervisorSignature
      }
    };

    if (isEdit) {
      updated = saved.map((p: any) => p.id === (form as any).id ? dataToSave : p);
      toast.success('Simulación actualizada');
    } else {
      const newForm = {
        ...dataToSave,
        id: `EVAC-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      updated = [newForm, ...saved];
      toast.success('Simulación guardada');
    }

    localStorage.setItem('evacuation_simulator_db', JSON.stringify(updated));
    navigate('/evacuation-history');
  };

  return (
    <div style={{ paddingTop: isMobile ? '7.5rem' : '6.5rem' }} className="min-h-[100vh] bg-[var(--color-background)] pb-[2rem]">
            <main className="p-[0rem_1.5rem] max-w-[1000px] m-[0_auto]">
                <div className="no-print mb-8">
                    <PremiumHeader
            title={isEdit ? 'Editar Simulación de Evacuación' : 'Simulador de Evacuación (Teórico)'}
            subtitle="Cálculo de tiempos teóricos de escape"
            icon={<Timer size={32} color="#ffffff" />}
            color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
          
                    <div className="flex justify-space-between items-center flex-wrap gap-[1rem] mt-[1rem]">
                        <></>
                    </div>
                </div>

                <div className="card p-[2rem] border-top-[4px_solid_#3b82f6] bg-[linear-gradient(180deg,_rgba(59,130,246,0.03)_0%,_rgba(0,0,0,0)_100%)] mb-[2rem]">
                    <h2 className="text-[1.25rem] m-[0_0_1.5rem] flex items-center gap-[0.5rem] text-[#3b82f6] font-[800]">
                        <Building2 size={24} /> Datos del Establecimiento
                    </h2>
                    
                    <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[1.5rem] mb-[2rem]">
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Sector / Edificio *</label>
                            <input type="text" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="Ej: Planta Baja, Oficinas Administrativas" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Fecha de Evaluación</label>
                            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                        </div>
                        <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Evaluador a Cargo *</label>
                            <input type="text" value={form.evaluator} onChange={(e) => setForm({ ...form, evaluator: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                        </div>
                    </div>
                </div>

                <div className="card p-[2rem] border-top-[4px_solid_#f97316] bg-[linear-gradient(180deg,_rgba(249,115,22,0.03)_0%,_rgba(0,0,0,0)_100%)] mb-[2rem]">
                    <h2 className="text-[1.25rem] m-[0_0_1.5rem] flex items-center gap-[0.5rem] text-[#f97316] font-[800]">
                        <Users size={24} /> Parámetros de Cálculo
                    </h2>

                    <div style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }} className="grid gap-[1.5rem]">
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Población Estimada (N)</label>
                            <div className="flex items-center gap-[0.5rem]">
                                <input type="number" min="1" value={form.peopleCount} onChange={(e) => setForm({ ...form, peopleCount: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                                <span className="text-[0.8rem] text-[var(--color-text-muted)]">personas</span>
                            </div>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Ancho Total Salidas (A)</label>
                            <div className="flex items-center gap-[0.5rem]">
                                <input type="number" step="0.1" min="0.8" value={form.exitWidth} onChange={(e) => setForm({ ...form, exitWidth: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                                <span className="text-[0.8rem] text-[var(--color-text-muted)]">metros</span>
                            </div>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Dist. Máx. a Salida (D)</label>
                            <div className="flex items-center gap-[0.5rem]">
                                <input type="number" min="1" value={form.maxDistance} onChange={(e) => setForm({ ...form, maxDistance: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                                <span className="text-[0.8rem] text-[var(--color-text-muted)]">metros</span>
                            </div>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Velocidad Marcha (V)</label>
                            <div className="flex items-center gap-[0.5rem]">
                                <input type="number" step="0.1" value={form.walkingSpeed} onChange={(e) => setForm({ ...form, walkingSpeed: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                                <span className="text-[0.8rem] text-[var(--color-text-muted)]">m/s</span>
                            </div>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Flujo Específico (k)</label>
                            <div className="flex items-center gap-[0.5rem]">
                                <input type="number" step="0.1" value={form.specificFlow} onChange={(e) => setForm({ ...form, specificFlow: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                                <span className="text-[0.8rem] text-[var(--color-text-muted)]">pers/m·s</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ flexDirection: isMobile ? 'column' : 'row' }} className="mt-[2.5rem] bg-[#1e293b] text-[white] p-[2rem] rounded-[16px] flex justify-space-between items-center gap-[2rem] box-shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                        <div className="flex-[1] flex flex-col gap-[1rem] w-[100%]">
                            <div className="flex justify-space-between border-bottom-[1px_solid_rgba(255,255,255,0.1)] pb-[0.5rem]">
                                <span className="text-[#94a3b8] text-[0.9rem]">Tiempo de Desplazamiento</span>
                                <span className="font-[700]">{results.travelTime} seg</span>
                            </div>
                            <div className="flex justify-space-between border-bottom-[1px_solid_rgba(255,255,255,0.1)] pb-[0.5rem]">
                                <span className="text-[#94a3b8] text-[0.9rem]">Tiempo de Paso por Puertas</span>
                                <span className="font-[700]">{results.flowTime} seg</span>
                            </div>
                        </div>
                        
                        <div className="text-center p-[1rem] bg-[linear-gradient(135deg,_#10b981,_#059669)] rounded-[12px] min-width-[200px]">
                            <span className="text-[0.8rem] font-[800] uppercase letter-spacing-[1px] opacity-[0.9]">Tiempo Total Estimado</span>
                            <div className="text-[3rem] font-[900] line-height-[1] m-[0.5rem_0]">{results.total} <span className="text-[1rem]">seg</span></div>
                            <span className="text-[0.75rem] opacity-[0.8]">(~{(Number(results.total) / 60).toFixed(1)} minutos)</span>
                        </div>
                    </div>

                    <div className="mt-[2.5rem]">
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Conclusiones / Observaciones</label>
                        <textarea
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              style={{ ...inputStyle }}
              placeholder="El tiempo de evacuación teórico es aceptable. Se recomienda realizar simulacro práctico para validar tiempos reales." className="min-h-[100px]" />
            
                    </div>
                </div>

                    {/* Firmas y Autorizaciones */}
                    <div className="card animate-fade-in mt-[2.5rem] bg-[rgba(var(--color-surface-rgb),_0.3)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] p-[2.5rem] box-shadow-[0_8px_32px_0_rgba(0,_0,_0,_0.08)]">
                        <h3 className="m-[0_0_2rem_0] flex items-center gap-[0.7rem] text-[var(--color-primary)] font-[900] text-[1.25rem] uppercase letter-spacing-[1.2px]">
                            <Pencil size={22} className="text-[var(--color-primary)]" /> Firmas y Autorizaciones del Reporte
                        </h3>

                        <div className="no-print mb-[2rem] p-[1.2rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] rounded-[16px] flex flex-col gap-[1rem] box-shadow-[0_4px_6px_rgba(0,0,0,0.02)]">









            
                            <div className="text-[var(--color-text)] text-[0.85rem] font-[800] uppercase letter-spacing-[0.5px]">
                                INCLUIR FIRMAS EN EL DOCUMENTO:
                            </div>
                            <div className="flex gap-[1rem] flex-wrap">
                                {[
              { id: 'operator', label: 'Evaluador Técnico' },
              { id: 'professional', label: 'Especialista H&S' },
              { id: 'supervisor', label: 'Responsable Sector' }].
              map((sig) => {
                const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                return (
                  <label key={sig.id} style={{





                    background: isChecked ? 'rgba(56, 189, 248, 0.1)' : 'var(--color-background)',
                    border: `1px solid ${isChecked ? '#38bdf8' : 'var(--color-border)'}`


                  }} className="flex items-center gap-[0.5rem] cursor-pointer p-[0.5rem_1rem] rounded-[20px] transition-[all_0.2s_ease]">
                                            <div style={{

                      border: `2px solid ${isChecked ? '#38bdf8' : 'var(--color-text-secondary)'}`,
                      background: isChecked ? '#38bdf8' : 'transparent'

                    }} className="w-[18px] h-[18px] rounded-[4px] flex items-center justify-center">
                                                {isChecked && <span className="text-[#fff] text-[12px] font-[bold]">✓</span>}
                                            </div>
                                            <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))} className="none" />

                     
                                            <span style={{ fontWeight: isChecked ? 700 : 500, color: isChecked ? 'var(--color-text)' : 'var(--color-text-secondary)' }} className="text-[0.9rem]">
                                                {sig.label}
                                            </span>
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
                title: 'EVALUADOR TÉCNICO',
                subtitle: (form.evaluator || 'Firma del Evaluador').toUpperCase(),
                signatureUrl: form.evaluatorSignature || null,
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
                title: 'RESPONSABLE SECTOR',
                subtitle: 'Firma de Responsable',
                signatureUrl: form.supervisorSignature || null,
                isProfessional: false
              } : null} />
            
            <PdfBrandingFooter />
                        </div>

                        {/* Interactive Signature Drawing Pads */}
                        <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {showSignatures.operator &&
            <div className="animate-fade-in bg-[rgba(var(--color-surface-rgb),_0.3)] backdrop-filter-[blur(10px)] rounded-[16px] p-[1.5rem] border-[1px_solid_var(--glass-border)]">





              
                                    <div className="text-[0.85rem] font-[800] text-[var(--color-text-secondary)] mb-[1rem] uppercase letter-spacing-[0.5px]">
                                        Firma de Evaluador Técnico
                                    </div>
                                    <SignatureCanvas
                onSave={(sig) => setForm((prev: any) => ({ ...prev, evaluatorSignature: sig || '' }))}
                initialImage={form.evaluatorSignature}
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
                                        Firma del Responsable del Sector
                                    </div>
                                    <SignatureCanvas
                onSave={(sig) => setForm((prev: any) => ({ ...prev, supervisorSignature: sig || '' }))}
                initialImage={form.supervisorSignature}
                label="" />
              
                                </div>
            }
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

          
                    <Save size={18} /> GUARDAR
                </button>
            </div>

            <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Simulación de Evacuación"
        text={`Simulación Sector ${form.sector} - Tiempo Total Estimado: ${results.total} segundos`}
        rawMessage={`Simulación Sector ${form.sector} - Tiempo Total Estimado: ${results.total} segundos`}
        fileName={`Evacuacion_${form.sector || 'Nuevo'}.pdf`} />
      

            <div className="print-only fixed left-[0] opacity-[0.01] top-[0]">
                <EvacuationPdfGenerator data={{
          ...form,
          calculatedTime: results.total,
          flowTime: results.flowTime,
          travelTime: results.travelTime,
          professionalSignature: form.professionalSignature || professional.signature,
          professionalName: form.professionalName || professional.name,
          professionalLicense: form.professionalLicense || professional.license,
          professionalStamp: form.professionalStamp || professional.stamp,
          signatures: {
            evaluator: form.evaluatorSignature || form.signatures?.evaluator || '',
            manager: form.supervisorSignature || form.signatures?.manager || ''
          }
        }} />
            </div>
        </div>);

}