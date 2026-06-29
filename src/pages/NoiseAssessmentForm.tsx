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
import {
  ModuleFormLayout,
  ModuleFormToolbar,
  ModuleFormDocument,
  ModuleFormSection,
  ModuleActionBar,
} from '../components/module';
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
    <ModuleFormLayout>
        <ModuleFormToolbar
          title={isEdit ? 'Editar Medición de Ruido' : 'Nueva Medición de Ruido'}
          subtitle="Evaluación de Niveles Sonoros"
          icon={<Volume2 size={32} color="#ffffff" />} />
        
        <ModuleFormDocument id="pdf-content">
            <ModuleFormSection title="Detalles de la Medición" icon={<Volume2 />}>
            <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[2rem]">
                        <div>
                            <h3 className="m-0 mb-4 text-base font-extrabold text-[var(--color-primary)]">Detalle del Equipo (Res. SRT 85/12)</h3>
                            <div className="grid grid-template-columns-[1fr] gap-[1rem]">
                                <div>
                                    <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Marca y Modelo del Decibelímetro</label>
                                    <input type="text" value={measurement.instrument.model} onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, model: e.target.value } })} className="module-form-input" placeholder="Ej: Casella 63x / Quest" />
                                </div>
                                <div>
                                    <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Número de Serie</label>
                                    <input type="text" value={measurement.instrument.serial} onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, serial: e.target.value } })} className="module-form-input" placeholder="Ej: S/N 123456" />
                                </div>
                                <div>
                                    <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Última Calibración</label>
                                    <input type="date" value={measurement.instrument.lastCalibration} onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, lastCalibration: e.target.value } })} className="module-form-input" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="m-0 mb-4 text-base font-extrabold text-[var(--color-primary)]">Condiciones de Medición</h3>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Ruido de Fondo (dB)</label>
                                    <input type="number" step="0.1" value={measurement.backgroundNoise} onChange={(e) => setMeasurement({ ...measurement, backgroundNoise: e.target.value })} className="module-form-input" placeholder="dB(A)" />
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
                        <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Observaciones / Conclusiones del Técnico</label>
                        <textarea
              value={measurement.observations}
              onChange={(e) => setMeasurement({ ...measurement, observations: e.target.value })}
              className="module-form-input min-h-[80px]"
              placeholder="Describa condiciones ambientales, anomalías o recomendaciones..." />
            
                    </div>

                    <div className="mt-8">
                        <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Profesional / Técnico Responsable</label>
                        <input type="text" value={measurement.technician} onChange={(e) => setMeasurement({ ...measurement, technician: e.target.value })} className="module-form-input" placeholder="Nombre y Apellido del Técnico" />
                    </div>
            </ModuleFormSection>

            <ModuleFormSection title="Firmas y Autorizaciones" icon={<Pencil />}>
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
            </ModuleFormSection>
        </ModuleFormDocument>

        <ModuleActionBar
            actions={[
                { id: 'save', label: 'GUARDAR MEDICIÓN', icon: <Save />, variant: 'primary', onClick: () => requirePro(handleSave) },
                { id: 'share', label: 'COMPARTIR', icon: <Share2 />, variant: 'secondary', onClick: () => requirePro(() => setShowShareModal(true)) },
                { id: 'print', label: 'IMPRIMIR PDF', icon: <Printer />, variant: 'secondary', onClick: () => requirePro(() => window.print()) }
            ]}
        />

            <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Medición de Ruido"
        text={`Evaluación de Ruido - ${measurement.workerName}`}
        rawMessage={`Evaluación de Ruido - ${measurement.workerName}`}
        fileName={`Ruido_${measurement.workerName || 'Sin_Nombre'}.pdf`} />
      

            <div className="print-only fixed left-[-9999px] top-[0] opacity-[0.01] pointer-events-none" id="pdf-content">
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
    </ModuleFormLayout>);

}

function LevelInput({ label, value, onChange, placeholder }) {
  return (
    <div>
            <label className="text-[0.75rem] font-[700] text-[var(--color-text)] block mb-[0.5rem]">{label}</label>
            <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="module-form-input p-[0.6rem_0.75rem] text-[0.9rem]"
        placeholder={placeholder} />
      
        </div>);

}