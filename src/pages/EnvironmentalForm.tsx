import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Leaf, Shield, AlertTriangle, Clock, CheckCircle2, User, MapPin, Activity, Droplets, Wind, Thermometer, Sun, Eye, Printer, Share2, Pencil } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import EnvironmentalPdf from '../components/EnvironmentalPdf';
import PdfSignatures from '../components/PdfSignatures';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PremiumHeader from '../components/PremiumHeader';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

const labelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  display: 'block'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.8rem 1rem',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  color: 'var(--color-text)',
  fontSize: '0.95rem',
  transition: 'all 0.2s',
  outline: 'none',
  marginTop: '0.5rem',
  boxSizing: 'border-box' as any
};

const labelSubStyle: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.4rem' };

const MONITORING_TYPES = [
{ id: 'air', name: 'Calidad de Aire', icon: '💨' },
{ id: 'water', name: 'Calidad de Agua', icon: '💧' },
{ id: 'noise', name: 'Ruido Ambiental', icon: '🔊' },
{ id: 'waste', name: 'Residuos', icon: '♻️' },
{ id: 'emissions', name: 'Emisiones', icon: '🏭' },
{ id: 'soil', name: 'Suelo', icon: '🌱' }];


export default function EnvironmentalForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const { isPro } = usePaywall();

  useDocumentTitle(isEdit ? 'Editar Monitoreo Ambiental' : 'Nuevo Monitoreo Ambiental');
  const [measurement, setMeasurement] = useState<any>({
    stationName: '',
    monitoringType: 'air',
    location: '',
    technician: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    weather: 'clear',
    parameters: {
      temp: '',
      humidity: '',
      pressure: '',
      co2: '',
      pm25: ''
    },
    instrument: {
      model: '',
      serial: '',
      lastCalibration: ''
    },
    regulatoryLimit: '', // VLE (Valor Límite de Exposición)
    observations: '',
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

  const handleSave = () => {
    if (!measurement.stationName || !measurement.location) {
      toast.error('Por favor complete los campos obligatorios (*)');
      return;
    }

    const saved = JSON.parse(localStorage.getItem('environmental_measurements_db') || '[]');
    let updated;

    const newMeasurement = {
      ...measurement,
      id: `ENV-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'normal',
      professionalSignature: measurement.professionalSignature || professional.signature,
      professionalName: measurement.professionalName || professional.name,
      professionalLicense: measurement.professionalLicense || professional.license,
      professionalStamp: measurement.professionalStamp || professional.stamp
    };

    if (isEdit) {
      const entryToSave = {
        ...measurement,
        professionalSignature: measurement.professionalSignature || professional.signature,
        professionalName: measurement.professionalName || professional.name,
        professionalLicense: measurement.professionalLicense || professional.license,
        professionalStamp: measurement.professionalStamp || professional.stamp
      };
      updated = saved.map((m: any) => m.id === (measurement as any).id ? entryToSave : m);
      toast.success('Registro ambiental actualizado');
    } else {
      updated = [newMeasurement, ...saved];
      toast.success('Registro ambiental guardado');
    }

    localStorage.setItem('environmental_measurements_db', JSON.stringify(updated));
    navigate('/environmental');
  };

  return (
    <div className="min-h-[100vh] bg-[var(--color-background)] pb-[2rem]">
            <div className="no-print p-[2rem_1.5rem_0] max-w-[1000px] m-[0_auto]">
                <PremiumHeader
          title={isEdit ? 'Editar Monitoreo Ambiental' : 'Nuevo Monitoreo Ambiental'}
          subtitle="Registro de Parámetros y Condiciones"
          icon={<Leaf size={32} color="#ffffff" />}
          color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
        

                <div className="flex justify-space-between items-center flex-wrap gap-[1rem] mt-[1rem]">
                    <></>
                </div>
            </div>

            <main className="p-[1.5rem] max-w-[1000px] m-[0_auto]">
                <div className="card p-[2rem] bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border)]">
                    <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[1.5rem]">
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Estación / Punto de Muestreo *</label>
                            <input type="text" value={measurement.stationName} onChange={(e) => setMeasurement({ ...measurement, stationName: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="Ej: Estación Meteorológica E1" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Tipo de Monitoreo</label>
                            <select value={measurement.monitoringType} onChange={(e) => setMeasurement({ ...measurement, monitoringType: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors">
                                {MONITORING_TYPES.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Ubicación / Coordenadas *</label>
                            <input type="text" value={measurement.location} onChange={(e) => setMeasurement({ ...measurement, location: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="Ej: Planta Alta - Sector Chimeneas" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Fecha de Medición</label>
                            <input type="date" value={measurement.date} onChange={(e) => setMeasurement({ ...measurement, date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Hora</label>
                            <input type="time" value={measurement.time} onChange={(e) => setMeasurement({ ...measurement, time: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Técnico Responsable</label>
                            <input type="text" value={measurement.technician} onChange={(e) => setMeasurement({ ...measurement, technician: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="Nombre" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Condiciones Climáticas</label>
                            <select value={measurement.weather} onChange={(e) => setMeasurement({ ...measurement, weather: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors">
                                <option value="clear">☀️ Despejado</option>
                                <option value="cloudy">☁️ Nublado</option>
                                <option value="rainy">🌧️ Lluvia</option>
                                <option value="windy">💨 Viento fuerte</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-[2.5rem]">
                        <h3 className="m-[0_0_1rem_0] text-[1rem] font-[800] text-[var(--color-primary)]">Parámetros Registrados</h3>
                        <div style={{ gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)' }} className="grid gap-[1rem]">
                            <div style={isMobile ? { gridColumn: 'span 2' } : {}}>
                                <label style={labelSubStyle}>Temperatura (°C)</label>
                                <input type="number" step="0.1" value={measurement.parameters.temp} onChange={(e) => setMeasurement({ ...measurement, parameters: { ...measurement.parameters, temp: e.target.value } })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="0.0" />
                            </div>
                            <div>
                                <label style={labelSubStyle}>Humedad (%)</label>
                                <input type="number" step="1" value={measurement.parameters.humidity} onChange={(e) => setMeasurement({ ...measurement, parameters: { ...measurement.parameters, humidity: e.target.value } })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="0" />
                            </div>
                            <div>
                                <label style={labelSubStyle}>Presión (hPa)</label>
                                <input type="number" step="1" value={measurement.parameters.pressure} onChange={(e) => setMeasurement({ ...measurement, parameters: { ...measurement.parameters, pressure: e.target.value } })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="1013" />
                            </div>
                            {measurement.monitoringType === 'air' &&
              <>
                                    <div>
                                        <label style={labelSubStyle}>CO2 (ppm)</label>
                                        <input type="number" value={measurement.parameters.co2} onChange={(e) => setMeasurement({ ...measurement, parameters: { ...measurement.parameters, co2: e.target.value } })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="400" />
                                    </div>
                                    <div>
                                        <label style={labelSubStyle}>PM2.5 (µg/m³)</label>
                                        <input type="number" value={measurement.parameters.pm25} onChange={(e) => setMeasurement({ ...measurement, parameters: { ...measurement.parameters, pm25: e.target.value } })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="15" />
                                    </div>
                                </>
              }
                        </div>
                    </div>

                    <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="mt-[2.5rem] grid gap-[2rem]">
                        <div>
                            <h3 className="m-0 mb-4 text-xl font-extrabold text-emerald-500">Equipo de Medición (Res. 295/03)</h3>
                            <div className="grid grid-template-columns-[1fr] gap-[1rem]">
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-slate-400">Marca / Modelo del Instrumento</label>
                                    <input type="text" value={measurement.instrument.model} onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, model: e.target.value } })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="Ej: Anemómetro / Luxómetro / Monitor Térmico" />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-slate-400">Número de Serie</label>
                                    <input type="text" value={measurement.instrument.serial} onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, serial: e.target.value } })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="S/N" />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-slate-400">Última Calibración</label>
                                    <input type="date" value={measurement.instrument.lastCalibration} onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, lastCalibration: e.target.value } })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="m-0 mb-4 text-xl font-extrabold text-emerald-500">Límites Normativos</h3>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-slate-400">Valor Límite de Exposición (VLE)</label>
                                    <input type="text" value={measurement.regulatoryLimit} onChange={(e) => setMeasurement({ ...measurement, regulatoryLimit: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="Ej: 500 Lux / 28°C WBGT" />
                                </div>
                                <div className="bg-[var(--color-surface)] p-[1rem] rounded-[var(--radius-lg)] border-[1px_solid_var(--color-border)]">
                                    <p className="m-[0] text-[0.75rem] text-[var(--color-text-muted)] font-style-[italic]">
                                        Referencia: Res. SRT 295/03 y Anexos. Asegúrese de comparar el promedio medido con el límite correspondiente a la jornada.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-[2.5rem]">
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Observaciones y Conclusiones del Monitoreo</label>
                        <textarea
              value={measurement.observations}
              onChange={(e) => setMeasurement({ ...measurement, observations: e.target.value })}
              style={{ ...inputStyle }}
              placeholder="Describa el estado de las instalaciones, fuentes emisoras detectadas y si se cumple con el VLE..." className="min-h-[100px] pt-[0.75rem]" />
            
                    </div>
                    {/* Firmas y Autorizaciones */}
                    <div className="card animate-fade-in mt-[2.5rem] bg-[rgba(var(--color-surface-rgb),_0.3)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] p-[2.5rem] box-shadow-[0_8px_32px_0_rgba(0,_0,_0,_0.08)]">
                        <h3 className="mt-[0] mb-[2rem] flex items-center gap-[0.7rem] text-[var(--color-primary)] font-[900] text-[1.25rem] uppercase letter-spacing-[1.2px]">
                            <Pencil size={22} className="text-[var(--color-primary)]" /> Firmas y Aprobaciones del Monitoreo
                        </h3>

                        {/* Custom visual switches */}
                        <div className="no-print mb-8 p-6 bg-[rgba(30,_41,_59,_0.2)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] w-[100%] flex flex-col gap-[1.25rem] justify-center items-center">
                            <div className="text-[var(--color-text)] font-[800] text-[0.85rem] uppercase letter-spacing-[0.5px]">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                            <div className="flex gap-[1rem] flex-wrap justify-center">
                                {[
                { id: 'operator', label: 'Técnico de Campo' },
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
                  title: 'TÉCNICO DE CAMPO',
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
                  title: 'RESPONSABLE AMBIENTAL',
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
                  title="Firma de Técnico de Campo" />
                
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

          
                    <Save size={18} /> GUARDAR REGISTRO
                </button>
            </div>

            <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Monitoreo Ambiental"
        text={`Monitoreo Ambiental: ${measurement.stationName}`}
        rawMessage={`Monitoreo Ambiental: ${measurement.stationName}`}
        fileName={`Ambiente_${measurement.stationName || 'Sin_Nombre'}.pdf`} />
      

            <div className="print-only fixed left-[0] opacity-[0.01] top-[0]">
                <EnvironmentalPdf data={{ ...measurement, id: (measurement as any).id || Date.now().toString(), createdAt: (measurement as any).createdAt || new Date().toISOString() }} />
            </div>
        </div>);

}