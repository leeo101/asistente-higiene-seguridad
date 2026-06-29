import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, FlaskConical, Shield, AlertTriangle, Droplets, Flame, Skull, Zap, Wind, Thermometer, Radio, CheckCircle2, Eye, Printer, Share2, Pencil } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import ChemicalSafetyPdf from '../components/ChemicalSafetyPdf';
import PdfSignatures from '../components/PdfSignatures';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import {
  ModuleFormLayout,
  ModuleFormToolbar,
  ModuleFormDocument,
  ModuleFormSection,
  ModuleActionBar,
} from '../components/module';

const GHS_PICTOGRAMS = {
  explosive: { icon: '🧨', name: 'Explosivo', color: '#dc2626' },
  flammable: { icon: '🔥', name: 'Inflamable', color: '#dc2626' },
  oxidizing: { icon: '🔥', name: 'Comburente', color: '#dc2626' },
  corrosive: { icon: '🧪', name: 'Corrosivo', color: '#dc2626' },
  toxic: { icon: '💀', name: 'Tóxico', color: '#dc2626' },
  harmful: { icon: '⚠️', name: 'Nocivo', color: '#f59e0b' },
  irritant: { icon: '⚠️', name: 'Irritante', color: '#f59e0b' },
  sensitizing: { icon: '🫁', name: 'Sensibilizante', color: '#f59e0b' },
  carcinogenic: { icon: '🫁', name: 'Carcinógeno', color: '#dc2626' },
  environmental: { icon: '🌊', name: 'Peligro Ambiente', color: '#16a34a' },
  pressure: { icon: '📦', name: 'Gas a Presión', color: '#dc2626' }
};

const HAZARD_CATEGORIES = [
{ id: 'fisico', name: 'Peligro Físico', icon: '🔥' },
{ id: 'salud', name: 'Peligro para la Salud', icon: '🏥' },
{ id: 'ambiental', name: 'Peligro Ambiental', icon: '🌍' }];




export default function ChemicalSafetyForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const { isPro } = usePaywall();

  useDocumentTitle(isEdit ? 'Editar Producto Químico' : 'Nuevo Producto Químico');
  const [chemical, setChemical] = useState<any>({
    name: '',
    casNumber: '',
    unNumber: '',
    category: 'fisico',
    hazards: [],
    pictograms: [],
    storage: '',
    location: '',
    quantity: '',
    unit: 'L',
    supplier: '',
    sdsDate: '',
    expiryDate: '',
    hazardStatements: [], // H-phrases
    precautionaryStatements: [], // P-phrases
    ppe: {
      gloves: false,
      mask: false,
      goggles: false,
      apron: false
    },
    firstAid: {
      inhalation: '',
      skin: '',
      eyes: '',
      ingestion: ''
    },
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
    setChemical((prev: any) => {
      const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
      return { ...prev, showSignatures: updated };
    });
  };

  const showSignatures = chemical.showSignatures || { operator: true, professional: true, supervisor: true };

  useEffect(() => {
    if (location.state?.editData) {
      const ed = location.state.editData;
      setChemical({
        ...ed,
        operatorSignature: ed.operatorSignature || '',
        professionalSignature: ed.professionalSignature || '',
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

  const handleSave = () => {
    if (!chemical.name.trim()) {
      toast.error('Por favor ingrese el nombre del producto');
      return;
    }

    const saved = JSON.parse(localStorage.getItem('chemical_safety_db') || '[]');
    let updated;

    const newChemical = {
      ...chemical,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'active',
      professionalSignature: chemical.professionalSignature || professional.signature,
      professionalName: chemical.professionalName || professional.name,
      professionalLicense: chemical.professionalLicense || professional.license,
      professionalStamp: chemical.professionalStamp || professional.stamp
    };

    if (isEdit) {
      const entryToSave = {
        ...chemical,
        professionalSignature: chemical.professionalSignature || professional.signature,
        professionalName: chemical.professionalName || professional.name,
        professionalLicense: chemical.professionalLicense || professional.license,
        professionalStamp: chemical.professionalStamp || professional.stamp
      };
      updated = saved.map((c: any) => c.id === (chemical as any).id ? entryToSave : c);
      toast.success('Ficha actualizada');
    } else {
      updated = [newChemical, ...saved];
      toast.success('Ficha guardada');
    }

    localStorage.setItem('chemical_safety_db', JSON.stringify(updated));
    navigate('/chemical-safety?created=true');
  };

  const togglePictogram = (pictoId) => {
    const current = chemical.pictograms || [];
    const updated = current.includes(pictoId) ?
    current.filter((p) => p !== pictoId) :
    [...current, pictoId];
    setChemical({ ...chemical, pictograms: updated });
  };

  return (
    <ModuleFormLayout>
        <ModuleFormToolbar
          title={isEdit ? 'Editar Producto Químico' : 'Nuevo Producto Químico'}
          subtitle="Ficha Técnica de Seguridad (SGA)"
          icon={<FlaskConical size={32} color="#ffffff" />}
        />
        
        <ModuleFormDocument id="pdf-content">
            <ModuleFormSection title="Datos del Producto" icon={<FlaskConical />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Nombre del Producto *</label>
                            <input type="text" value={chemical.name} onChange={(e) => setChemical({ ...chemical, name: e.target.value })} className="module-form-input" placeholder="Ej: Acetona, Ácido Sulfúrico..." />
                        </div>
                        <div>
                            <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Número CAS</label>
                            <input type="text" value={chemical.casNumber} onChange={(e) => setChemical({ ...chemical, casNumber: e.target.value })} className="module-form-input" placeholder="Ej: 67-64-1" />
                        </div>
                        <div>
                            <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Número UN</label>
                            <input type="text" value={chemical.unNumber} onChange={(e) => setChemical({ ...chemical, unNumber: e.target.value })} className="module-form-input" placeholder="Ej: UN1090" />
                        </div>
                        <div>
                            <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Categoría de Peligro</label>
                            <select value={chemical.category} onChange={(e) => setChemical({ ...chemical, category: e.target.value })} className="module-form-input">
                                {HAZARD_CATEGORIES.map((cat) => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Ubicación / Depósito</label>
                            <input type="text" value={chemical.location} onChange={(e) => setChemical({ ...chemical, location: e.target.value })} className="module-form-input" placeholder="Ej: Almacén Inflamables" />
                        </div>
                        <div>
                            <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Cantidad en Stock</label>
                            <div className="flex gap-2">
                                <input type="text" value={chemical.quantity} onChange={(e) => setChemical({ ...chemical, quantity: e.target.value })} className="module-form-input flex-[2]" placeholder="Ej: 100" />
                                <select value={chemical.unit} onChange={(e) => setChemical({ ...chemical, unit: e.target.value })} className="module-form-input flex-1">
                                    <option value="L">Litros</option>
                                    <option value="kg">Kilogramos</option>
                                    <option value="und">Unidades</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Proveedor</label>
                            <input type="text" value={chemical.supplier} onChange={(e) => setChemical({ ...chemical, supplier: e.target.value })} className="module-form-input" placeholder="Nombre del proveedor" />
                        </div>
                    </div>
            </ModuleFormSection>

            <ModuleFormSection title="Pictogramas y Riesgos" icon={<AlertTriangle />}>
                    <div className="mt-[1rem]">
                        <h3 className="m-0 mb-4 text-base font-extrabold text-[var(--color-primary)]">Pictogramas SGA (Sistema Globalmente Armonizado)</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {Object.entries(GHS_PICTOGRAMS).map(([key, config]) =>
              <button
                key={key}
                onClick={() => togglePictogram(key)}
                style={{
                  background: chemical.pictograms?.includes(key) ? `${config.color}15` : 'var(--color-surface)',
                  border: `2px solid ${chemical.pictograms?.includes(key) ? config.color : 'var(--color-border)'}`
                }} className="p-[1rem] rounded-[var(--radius-xl)] cursor-pointer flex flex-col items-center gap-[0.5rem] transition-[all_0.2s]">
                
                                    <span className="text-[2.5rem]">{config.icon}</span>
                                    <span style={{ color: chemical.pictograms?.includes(key) ? config.color : 'var(--color-text-muted)' }} className="text-[0.7rem] font-[800] text-center">{config.name}</span>
                                </button>
              )}
                      </div>
                     </div>
                     <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="m-0 mb-4 text-lg font-extrabold text-[var(--color-primary)]">Frases H y P (Res. 801/15)</h3>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Indicaciones de Peligro (H)</label>
                                    <textarea
                    value={chemical.hazardStatements.join('\n')}
                    onChange={(e) => setChemical({ ...chemical, hazardStatements: e.target.value.split('\n') })}
                    className="module-form-input min-h-[80px]"
                    placeholder="Ej: H225 Líquido y vapores muy inflamables" />
                  
                                                </div>
                                <div>
                                    <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Consejos de Prudencia (P)</label>
                                    <textarea
                    value={chemical.precautionaryStatements.join('\n')}
                    onChange={(e) => setChemical({ ...chemical, precautionaryStatements: e.target.value.split('\n') })}
                    className="module-form-input min-h-[80px]"
                    placeholder="Ej: P210 Mantener alejado del calor..." />
                  
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="m-0 mb-4 text-lg font-extrabold text-[var(--color-primary)]">EPP Requerido</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(chemical.ppe).map(([key, value]) =>
                <button
                  key={key}
                  onClick={() => setChemical({ ...chemical, ppe: { ...chemical.ppe, [key]: !value } })}
                  style={{
                    background: value ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-surface)',
                    border: `2px solid ${value ? 'var(--color-primary)' : 'var(--color-border)'}`
                  }} className="p-[0.75rem] rounded-[var(--radius-lg)] cursor-pointer flex items-center gap-[0.50rem]">
                  
                                        <div style={{ background: value ? 'var(--color-primary)' : 'transparent' }} className="w-[16px] h-[16px] rounded-[4px] border-[2px_solid_var(--color-primary)] flex items-center justify-center">
                                            {value && <CheckCircle2 size={12} color="#fff" />}
                                        </div>
                                        <span className="text-[0.8rem] font-[700] capitalize">
                                            {key === 'gloves' && 'Guantes Químicos'}
                                            {key === 'mask' && 'Máscara p/ Vapores'}
                                            {key === 'goggles' && 'Antiparras'}
                                            {key === 'apron' && 'Delantal Impermeable'}
                                        </span>
                                    </button>
                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-[2.5rem]">
                        <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Almacenamiento, Compatibilidad y Primeros Auxilios</label>
                        <textarea
              value={chemical.storage}
              onChange={(e) => setChemical({ ...chemical, storage: e.target.value })}
              className="module-form-input min-h-[100px] pt-3"
              placeholder="Describa condiciones especiales, incompatibilidades y medidas urgentes de primeros auxilios..." />
            
                    </div>
            </ModuleFormSection>

            <ModuleFormSection title="Firmas y Autorizaciones" icon={<Pencil />}>
                        <div className="no-print mb-8 p-6 bg-[rgba(30,_41,_59,_0.2)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] w-[100%] flex flex-col gap-[1.25rem] justify-center items-center">
                            <div className="text-[var(--color-text)] font-[800] text-[0.85rem] uppercase letter-spacing-[0.5px]">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                            <div className="flex gap-[1rem] flex-wrap justify-center">
                                {[
                { id: 'operator', label: 'Personal Afectado' },
                { id: 'professional', label: 'Especialista Higiene y Seguridad' },
                { id: 'supervisor', label: 'Encargado / Supervisor' }].
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
                        onChange={(e) => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))} className="hidden" />
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
                  ...chemical,
                  professionalSignature: professional.signature,
                  professionalName: professional.name,
                  professionalLicense: professional.license,
                  professionalStamp: professional.stamp
                }}
                box1={showSignatures.operator ? {
                  title: 'PERSONAL AFECTADO',
                  subtitle: 'Firma y Aclaración',
                  signatureUrl: chemical.operatorSignature || null,
                  isProfessional: false
                } : null}
                box2={showSignatures.professional ? {
                  title: 'PROFESIONAL H&S',
                  subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                  signatureUrl: chemical.professionalSignature || professional.signature || null,
                  stampUrl: chemical.professionalStamp || professional.stamp || null,
                  isProfessional: true,
                  license: professional.license
                } : null}
                box3={showSignatures.supervisor ? {
                  title: 'SUPERVISIÓN / CIERRE',
                  subtitle: 'Sello y Firma receptora',
                  signatureUrl: chemical.supervisorSignature || chemical.signature || null,
                  isProfessional: false
                } : null} />
              
            <PdfBrandingFooter />
                        </div>

                        <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {showSignatures.operator &&
              <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas
                  onSave={(sig) => setChemical((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                  initialImage={chemical.operatorSignature}
                  title="Firma de Personal Afectado" />
                
                                </div>
              }
                            
                            {showSignatures.professional &&
              <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas
                  onSave={(sig) => setChemical((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                  initialImage={chemical.professionalSignature || professional.signature}
                  title="Firma de Especialista H&S" />
                
                                </div>
              }

                            {showSignatures.supervisor &&
              <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas
                  onSave={(sig) => setChemical((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                  initialImage={chemical.supervisorSignature || chemical.signature}
                  title="Firma de Supervisor / Cierre" />
                
                                </div>
              }
                        </div>
            </ModuleFormSection>
        </ModuleFormDocument>

        <ModuleActionBar
            actions={[
                { id: 'save', label: 'GUARDAR FICHA', icon: <Save />, variant: 'primary', onClick: () => requirePro(handleSave) },
                { id: 'share', label: 'COMPARTIR', icon: <Share2 />, variant: 'secondary', onClick: () => requirePro(() => setShowShareModal(true)) },
                { id: 'print', label: 'IMPRIMIR PDF', icon: <Printer />, variant: 'secondary', onClick: () => requirePro(() => window.print()) }
            ]}
        />

            <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Ficha Técnica Química"
        text={`Ficha de Seguridad: ${chemical.name}`}
        rawMessage={`Ficha de Seguridad: ${chemical.name}`}
        fileName={`Quimico_${chemical.name || 'Sin_Nombre'}.pdf`} />
      

            <div className="print-only fixed left-[-9999px] top-[0] opacity-[0.01] pointer-events-none" id="pdf-content">
                <ChemicalSafetyPdf data={{ ...chemical, id: (chemical as any).id || Date.now().toString(), createdAt: (chemical as any).createdAt || new Date().toISOString() }} />
            </div>
    </ModuleFormLayout>);
}