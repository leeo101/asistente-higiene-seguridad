import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Volume2, Save, Eye, Printer, Share2, Pencil, CheckCircle2 } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import NoiseAssessmentPdf from '../components/NoiseAssessmentPdf';
import PdfSignatures from '../components/PdfSignatures';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PremiumHeader from '../components/PremiumHeader';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

const NOISE_LIMITS = {
  actionLevel: 80,
  actionLevelHigh: 85,
  limitValue: 87,
  peakAction: 135,
  peakLimit: 140
};

const HEARING_PROTECTION = [
{ id: 'earplugs', name: 'Tapones de espuma', nrr: 29 },
{ id: 'earmuffs', name: 'Orejeras', nrr: 25 },
{ id: 'dual', name: 'Protección dual', nrr: 35 }];


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

export default function NoiseAssessmentForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useDocumentTitle(isEdit ? 'Editar Medición de Ruido' : 'Nueva Medición de Ruido');
  const [measurement, setMeasurement] = useState<any>({
    workerName: '',
    type: 'personal',
    date: new Date().toISOString().split('T')[0],
    location: '',
    task: '',
    duration: '',
    levels: { lavg: '', lmax: '', lmin: '', lpeak: '', lex8h: '', dose: '' },
    hearingProtection: '',
    observations: '',
    technician: '',
    instrument: {
      model: '',
      serial: '',
      lastCalibration: ''
    },
    backgroundNoise: '',
    signature: '',
    operatorSignature: '',
    supervisorSignature: '',
    professionalSignature: '',
    showSignatures: { operator: true, professional: true, supervisor: true }
  });

  const [professional, setProfessional] = useState<any>({
    name: '',
    license: '',
    signature: null,
    stamp: null
  });

  const setShowSignatures = (updater: any) => {
    setMeasurement((prev: any) => {
      const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
      return { ...prev, showSignatures: updated };
    });
  };

  const showSignatures = measurement.showSignatures || { operator: true, professional: true, supervisor: true };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (location.state?.editData) {
      const ed = location.state.editData;
      setMeasurement({
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

  useEffect(() => {
    if (measurement.levels.lavg && measurement.duration) {
      const lavg = parseFloat(measurement.levels.lavg);
      const duration = parseFloat(measurement.duration);
      if (!isNaN(lavg) && !isNaN(duration)) {
        // Cálculo de tiempo permitido T (Res. 295/03, exchange rate 3dB)
        const T = 8 / Math.pow(2, (lavg - 85) / 3);
        // Cálculo de dosis (C/T * 100)
        const dose = (duration / T * 100).toFixed(1);

        if (measurement.levels.dose !== dose) {
          setMeasurement((prev: any) => ({
            ...prev,
            levels: { ...prev.levels, dose }
          }));
        }
      }
    }
  }, [measurement.levels.lavg, measurement.duration]);

  const calculateRiskLevel = (level: number) => {
    if (level >= NOISE_LIMITS.limitValue) return { level: 'critical', color: '#dc2626', label: 'CRÍTICO' };
    if (level >= NOISE_LIMITS.actionLevelHigh) return { level: 'high', color: '#f59e0b', label: 'ALTO' };
    if (level >= NOISE_LIMITS.actionLevel) return { level: 'medium', color: '#eab308', label: 'MEDIO' };
    return { level: 'low', color: '#16a34a', label: 'BAJO' };
  };

  const handleSave = () => {
    if (!measurement.workerName || !measurement.levels.lavg) {
      toast.error('Por favor complete los campos obligatorios (*)');
      return;
    }

    const saved = JSON.parse(localStorage.getItem('noise_assessments_db') || '[]');
    let updated;

    const newEntry = {
      ...measurement,
      id: `NA-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: calculateRiskLevel(parseFloat(measurement.levels.lavg) || 0),
      professionalSignature: measurement.professionalSignature || professional.signature,
      professionalName: measurement.professionalName || professional.name,
      professionalLicense: measurement.professionalLicense || professional.license,
      professionalStamp: measurement.professionalStamp || professional.stamp,
      showSignatures: measurement.showSignatures || { operator: true, professional: true, supervisor: true }
    };

    if (isEdit) {
      const entryToSave = {
        ...measurement,
        professionalSignature: measurement.professionalSignature || professional.signature,
        professionalName: measurement.professionalName || professional.name,
        professionalLicense: measurement.professionalLicense || professional.license,
        professionalStamp: measurement.professionalStamp || professional.stamp
      };
      updated = saved.map((n: any) => n.id === (measurement as any).id ? entryToSave : n);
      toast.success('Medición actualizada');
    } else {
      updated = [newEntry, ...saved];
      toast.success('Medición guardada');
    }

    localStorage.setItem('noise_assessments_db', JSON.stringify(updated));
    navigate('/noise-assessment');
  };

  const handleLevelChange = (field: string, value: string) => {
    setMeasurement({ ...measurement, levels: { ...measurement.levels, [field]: value } });
  };

  return (
    <div className="min-h-[100vh] bg-[var(--color-background)] p-[6.5rem_1rem_2rem]">
            <div className="no-print mb-8">
                <PremiumHeader
          title={isEdit ? 'Editar Medición de Ruido' : 'Nueva Medición de Ruido'}
          subtitle="Evaluación de Niveles Sonoros"
          icon={<Volume2 size={32} color="#ffffff" />}
          color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
        
                <div className="flex justify-space-between items-center flex-wrap gap-[1rem] mt-[1rem]">
                    <></>
                </div>
            </div>

            <main className="p-[0_1rem_1.5rem] max-w-[800px] m-[0_auto]">
                <div className="card p-[2rem] bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border)]">
                    <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[1.5rem]">
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Trabajador *</label>
                            <input type="text" value={measurement.workerName} onChange={(e) => setMeasurement({ ...measurement, workerName: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="Nombre completo" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Fecha</label>
                            <input type="date" value={measurement.date} onChange={(e) => setMeasurement({ ...measurement, date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Ubicación</label>
                            <input type="text" value={measurement.location} onChange={(e) => setMeasurement({ ...measurement, location: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="Ej: Planta Principal" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Tarea</label>
                            <input type="text" value={measurement.task} onChange={(e) => setMeasurement({ ...measurement, task: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="Ej: Operación de sierra" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Duración (horas)</label>
                            <input type="number" step="0.5" value={measurement.duration} onChange={(e) => setMeasurement({ ...measurement, duration: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="8" />
                        </div>
                    </div>

                    <div className="mt-[2.5rem]">
                        <h3 className="m-[0_0_1rem_0] text-[1rem] font-[800] text-[var(--color-primary)]">Niveles de Ruido (dB)</h3>
                        <div style={{ gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)' }} className="grid gap-[1rem]">
                            <LevelInput label="Lavg (Promedio) *" value={measurement.levels.lavg} onChange={(v) => handleLevelChange('lavg', v)} placeholder="85" />
                            <LevelInput label="Dosis D% *" value={measurement.levels.dose} onChange={(v) => handleLevelChange('dose', v)} placeholder="100" />
                            <LevelInput label="Lmax" value={measurement.levels.lmax} onChange={(v) => handleLevelChange('lmax', v)} placeholder="95" />
                            <LevelInput label="Lmin" value={measurement.levels.lmin} onChange={(v) => handleLevelChange('lmin', v)} placeholder="70" />
                            <LevelInput label="Lpeak" value={measurement.levels.lpeak} onChange={(v) => handleLevelChange('lpeak', v)} placeholder="130" />
                            <LevelInput label="Lex 8h" value={measurement.levels.lex8h} onChange={(v) => handleLevelChange('lex8h', v)} placeholder="82" />
                        </div>
                    </div>

                    <div className="mt-8">
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Protección Auditiva</label>
                        <select value={measurement.hearingProtection} onChange={(e) => setMeasurement({ ...measurement, hearingProtection: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors">
                            <option value="">Sin protección</option>
                            {HEARING_PROTECTION.map((hp) =>
              <option key={hp.id} value={hp.id}>{hp.name} (NRR: {hp.nrr})</option>
              )}
                        </select>
                    </div>

                    <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="mt-[2.5rem] grid gap-[2rem]">
                        <div>
                            <h3 className="m-0 mb-4 text-xl font-extrabold text-emerald-500">Detalle del Equipo (Res. SRT 85/12)</h3>
                            <div className="grid grid-template-columns-[1fr] gap-[1rem]">
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-slate-400">Marca y Modelo del Decibelímetro</label>
                                    <input type="text" value={measurement.instrument.model} onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, model: e.target.value } })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="Ej: Casella 63x / Quest" />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-slate-400">Número de Serie</label>
                                    <input type="text" value={measurement.instrument.serial} onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, serial: e.target.value } })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="Ej: S/N 123456" />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-slate-400">Última Calibración</label>
                                    <input type="date" value={measurement.instrument.lastCalibration} onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, lastCalibration: e.target.value } })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="m-0 mb-4 text-xl font-extrabold text-emerald-500">Condiciones de Medición</h3>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-slate-400">Ruido de Fondo (dB)</label>
                                    <input type="number" step="0.1" value={measurement.backgroundNoise} onChange={(e) => setMeasurement({ ...measurement, backgroundNoise: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="dB(A)" />
                                </div>
                                <div className="bg-[var(--color-surface)] p-[1rem] rounded-[var(--radius-lg)] border-[1px_solid_var(--color-border)]">
                                    <p className="m-[0] text-[0.75rem] text-[var(--color-text-muted)] font-style-[italic]">
                                        Nota: Según Res. 85/12, si la diferencia entre el ruido total y el de fondo es menor a 3dB, la medición no es válida para el puesto.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Observaciones / Conclusiones del Técnico</label>
                        <textarea
              value={measurement.observations}
              onChange={(e) => setMeasurement({ ...measurement, observations: e.target.value })}
              style={{ ...inputStyle }}
              placeholder="Describa condiciones ambientales, anomalías o recomendaciones..." className="min-h-[80px] pt-[0.75rem]" />
            
                    </div>

                    <div className="mt-8">
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Profesional / Técnico Responsable</label>
                        <input type="text" value={measurement.technician} onChange={(e) => setMeasurement({ ...measurement, technician: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="Nombre y Apellido del Técnico" />
                    </div>

                    {/* Firmas y Autorizaciones */}
                    <div className="card animate-fade-in mt-[2.5rem] bg-[rgba(var(--color-surface-rgb),_0.3)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] p-[2.5rem] box-shadow-[0_8px_32px_0_rgba(0,_0,_0,_0.08)]">
                        <h3 className="m-[0_0_2rem_0] flex items-center gap-[0.7rem] text-[var(--color-primary)] font-[900] text-[1.25rem] uppercase letter-spacing-[1.2px]">
                            <Pencil size={22} className="text-[var(--color-primary)]" /> Firmas y Aprobaciones de la Medición
                        </h3>

                        <div className="no-print mb-8 p-6 bg-[rgba(30,_41,_59,_0.2)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] w-[100%] flex flex-col gap-[1.25rem] justify-center items-center">
                            <div className="text-[var(--color-text)] font-[800] text-[0.85rem] uppercase letter-spacing-[0.5px]">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                            <div className="flex gap-[1rem] flex-wrap justify-center">
                                {[
                { id: 'operator', label: 'Trabajador Evaluado' },
                { id: 'professional', label: 'Especialista H&S' },
                { id: 'supervisor', label: 'Responsable / Auditor' }].
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
                  ...measurement,
                  professionalSignature: professional.signature,
                  professionalName: professional.name,
                  professionalLicense: professional.license,
                  professionalStamp: professional.stamp
                }}
                box1={showSignatures.operator ? {
                  title: 'TRABAJADOR EVALUADO',
                  subtitle: 'Firma y Aclaración',
                  signatureUrl: measurement.operatorSignature || null,
                  isProfessional: false
                } : null}
                box2={showSignatures.professional ? {
                  title: 'ESPECIALISTA H&S',
                  subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                  signatureUrl: measurement.professionalSignature || professional.signature || null,
                  stampUrl: measurement.professionalStamp || professional.stamp || null,
                  isProfessional: true,
                  license: professional.license
                } : null}
                box3={showSignatures.supervisor ? {
                  title: 'RESPONSABLE / AUDITOR',
                  subtitle: 'Aprobación / Autoridad',
                  signatureUrl: measurement.supervisorSignature || measurement.signature || null,
                  isProfessional: false
                } : null} />
              
            <PdfBrandingFooter />
                        </div>

                        {/* Interactive Signature Drawing Pads */}
                        <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {showSignatures.operator &&
              <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas
                  onSave={(sig) => setMeasurement((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                  initialImage={measurement.operatorSignature}
                  title="Firma de Trabajador Evaluado" />
                
                                </div>
              }
                            
                            {showSignatures.professional &&
              <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas
                  onSave={(sig) => setMeasurement((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                  initialImage={measurement.professionalSignature || professional.signature}
                  title="Firma de Especialista H&S" />
                
                                </div>
              }

                            {showSignatures.supervisor &&
              <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas
                  onSave={(sig) => setMeasurement((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                  initialImage={measurement.supervisorSignature || measurement.signature}
                  title="Firma de Responsable / Auditor" />
                
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

          
                    <Save size={18} /> GUARDAR MEDICIÓN
                </button>
            </div>

            <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Medición de Ruido"
        text={`Evaluación de Ruido - ${measurement.workerName}`}
        rawMessage={`Evaluación de Ruido - ${measurement.workerName}`}
        fileName={`Ruido_${measurement.workerName || 'Sin_Nombre'}.pdf`} />
      

            <div className="print-only fixed left-[0] opacity-[0.01] top-[0]">
                <NoiseAssessmentPdf data={{
          ...measurement,
          professionalSignature: measurement.professionalSignature || professional.signature,
          professionalName: professional.name,
          professionalLicense: professional.license,
          professionalStamp: measurement.professionalStamp || professional.stamp,
          id: (measurement as any).id || Date.now().toString(),
          createdAt: (measurement as any).createdAt || new Date().toISOString()
        }} />
            </div>
        </div>);

}

function LevelInput({ label, value, onChange, placeholder }) {
  return (
    <div>
            <label style={{ ...labelStyle }} className="text-[0.75rem]">{label}</label>
            <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle }}
        placeholder={placeholder} className="p-[0.6rem_0.75rem] text-[0.9rem]" />
      
        </div>);

}