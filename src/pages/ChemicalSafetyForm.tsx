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
import PremiumHeader from '../components/PremiumHeader';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

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
    { id: 'ambiental', name: 'Peligro Ambiental', icon: '🌍' }
];

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
            professionalStamp: chemical.professionalStamp || professional.stamp,
        };

        if (isEdit) {
            const entryToSave = {
                ...chemical,
                professionalSignature: chemical.professionalSignature || professional.signature,
                professionalName: chemical.professionalName || professional.name,
                professionalLicense: chemical.professionalLicense || professional.license,
                professionalStamp: chemical.professionalStamp || professional.stamp,
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
        const updated = current.includes(pictoId) 
            ? current.filter(p => p !== pictoId) 
            : [...current, pictoId];
        setChemical({ ...chemical, pictograms: updated });
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', padding: '6.5rem 1rem 2rem' }}>
            <div className="no-print" style={{ marginBottom: '2rem' }}>
                <PremiumHeader 
                    title={isEdit ? 'Editar Producto Químico' : 'Nuevo Producto Químico'}
                    subtitle="Ficha Técnica de Seguridad (SGA)"
                    icon={<FlaskConical size={32} color="#ffffff" />}
                    color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: 'linear-gradient(135deg, #36B37E 0%, #2A9365 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 15px rgba(54, 179, 126, 0.3)'
                        }}
                    >
                        <ArrowLeft size={18} />
                        VOLVER
                    </button>
                </div>
            </div>
            <main style={{ padding: '0 1rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>

                <div className="card" style={{ padding: '2rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Nombre del Producto *</label>
                            <input type="text" value={chemical.name} onChange={(e) => setChemical({ ...chemical, name: e.target.value })} style={inputStyle} placeholder="Ej: Acetona, Ácido Sulfúrico..." />
                        </div>
                        <div>
                            <label style={labelStyle}>Número CAS</label>
                            <input type="text" value={chemical.casNumber} onChange={(e) => setChemical({ ...chemical, casNumber: e.target.value })} style={inputStyle} placeholder="Ej: 67-64-1" />
                        </div>
                        <div>
                            <label style={labelStyle}>Número UN</label>
                            <input type="text" value={chemical.unNumber} onChange={(e) => setChemical({ ...chemical, unNumber: e.target.value })} style={inputStyle} placeholder="Ej: UN1090" />
                        </div>
                        <div>
                            <label style={labelStyle}>Categoría de Peligro</label>
                            <select value={chemical.category} onChange={(e) => setChemical({ ...chemical, category: e.target.value })} style={inputStyle}>
                                {HAZARD_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Ubicación / Depósito</label>
                            <input type="text" value={chemical.location} onChange={(e) => setChemical({ ...chemical, location: e.target.value })} style={inputStyle} placeholder="Ej: Almacén Inflamables" />
                        </div>
                        <div>
                            <label style={labelStyle}>Cantidad en Stock</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="text" value={chemical.quantity} onChange={(e) => setChemical({ ...chemical, quantity: e.target.value })} style={{ ...inputStyle, flex: 2 }} placeholder="Ej: 100" />
                                <select value={chemical.unit} onChange={(e) => setChemical({ ...chemical, unit: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
                                    <option value="L">Litros</option>
                                    <option value="kg">Kilogramos</option>
                                    <option value="und">Unidades</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Proveedor</label>
                            <input type="text" value={chemical.supplier} onChange={(e) => setChemical({ ...chemical, supplier: e.target.value })} style={inputStyle} placeholder="Nombre del proveedor" />
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Pictogramas SGA (Sistema Globalmente Armonizado)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                            {Object.entries(GHS_PICTOGRAMS).map(([key, config]) => (
                                <button
                                    key={key}
                                    onClick={() => togglePictogram(key)}
                                    style={{
                                        padding: '1rem',
                                        background: chemical.pictograms?.includes(key) ? `${config.color}15` : 'var(--color-background)',
                                        border: `2px solid ${chemical.pictograms?.includes(key) ? config.color : 'var(--color-border)'}`,
                                        borderRadius: 'var(--radius-xl)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span style={{ fontSize: '2.5rem' }}>{config.icon}</span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: chemical.pictograms?.includes(key) ? config.color : 'var(--color-text-muted)', textAlign: 'center' }}>{config.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Frases H y P (Res. 801/15)</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Indicaciones de Peligro (H)</label>
                                    <textarea 
                                        value={chemical.hazardStatements.join('\n')} 
                                        onChange={(e) => setChemical({ ...chemical, hazardStatements: e.target.value.split('\n') })} 
                                        style={{ ...inputStyle, minHeight: '80px' }} 
                                        placeholder="Ej: H225 Líquido y vapores muy inflamables" 
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Consejos de Prudencia (P)</label>
                                    <textarea 
                                        value={chemical.precautionaryStatements.join('\n')} 
                                        onChange={(e) => setChemical({ ...chemical, precautionaryStatements: e.target.value.split('\n') })} 
                                        style={{ ...inputStyle, minHeight: '80px' }} 
                                        placeholder="Ej: P210 Mantener alejado del calor..." 
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>EPP Requerido</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                {Object.entries(chemical.ppe).map(([key, value]) => (
                                    <button
                                        key={key}
                                        onClick={() => setChemical({ ...chemical, ppe: { ...chemical.ppe, [key]: !value } })}
                                        style={{
                                            padding: '0.75rem',
                                            background: value ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-surface)',
                                            border: `2px solid ${value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                            borderRadius: 'var(--radius-lg)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.50rem'
                                        }}
                                    >
                                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '2px solid var(--color-primary)', background: value ? 'var(--color-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {value && <CheckCircle2 size={12} color="#fff" />}
                                        </div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'capitalize' }}>
                                            {key === 'gloves' && 'Guantes Químicos'}
                                            {key === 'mask' && 'Máscara p/ Vapores'}
                                            {key === 'goggles' && 'Antiparras'}
                                            {key === 'apron' && 'Delantal Impermeable'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <label style={labelStyle}>Almacenamiento, Compatibilidad y Primeros Auxilios</label>
                        <textarea 
                            value={chemical.storage} 
                            onChange={(e) => setChemical({ ...chemical, storage: e.target.value })} 
                            style={{ ...inputStyle, minHeight: '100px', paddingTop: '0.75rem' }} 
                            placeholder="Describa condiciones especiales, incompatibilidades y medidas urgentes de primeros auxilios..."
                        />
                    </div>

                    {/* Firmas y Autorizaciones */}
                    <div className="card animate-fade-in" style={{ marginTop: '2.5rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)' }}>
                        <h3 style={{ margin: '0 0 2rem 0', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                            <Pencil size={22} style={{ color: 'var(--color-primary)' }} /> Firmas y Autorizaciones de Seguridad Química
                        </h3>

                        <div className="no-print mb-8 p-6" style={{ background: 'rgba(30, 41, 59, 0.2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ color: 'var(--color-text)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {[
                                    { id: 'operator', label: 'Personal Afectado' },
                                    { id: 'professional', label: 'Especialista Higiene y Seguridad' },
                                    { id: 'supervisor', label: 'Encargado / Supervisor' }
                                ].map(sig => {
                                    const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                                    return (
                                        <label
                                            key={sig.id}
                                            className="flex items-center gap-2 cursor-pointer select-none"
                                            style={{
                                                padding: '0.55rem 1.1rem',
                                                borderRadius: 'var(--radius-full)',
                                                border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                                background: isChecked ? 'rgba(var(--color-primary-rgb), 0.15)' : 'transparent',
                                                color: isChecked ? 'var(--color-primary)' : 'var(--color-text-light)',
                                                fontWeight: 750,
                                                fontSize: '0.8rem',
                                                transition: 'all 0.2s ease',
                                                boxShadow: isChecked ? '0 0 10px rgba(var(--color-primary-rgb), 0.15)' : 'none'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={e => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))}
                                                style={{ display: 'none' }}
                                            />
                                            <div style={{
                                                width: '16px',
                                                height: '16px',
                                                borderRadius: '4px',
                                                border: isChecked ? '2px solid var(--color-primary)' : '2px solid var(--color-text-light)',
                                                background: isChecked ? 'var(--color-primary)' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s ease'
                                            }}>
                                                {isChecked && <CheckCircle2 size={12} color="white" />}
                                            </div>
                                            {sig.label}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* On-Sheet Visual Preview of PDF signature blocks */}
                        <div style={{ marginBottom: '2.5rem' }}>
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
                                } : null}
                            />
            <PdfBrandingFooter />
                        </div>

                        {/* Interactive Signature Drawing Pads */}
                        <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {showSignatures.operator && (
                                <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas 
                                        onSave={(sig) => setChemical((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                                        initialImage={chemical.operatorSignature}
                                        title="Firma de Personal Afectado"
                                    />
                                </div>
                            )}
                            
                            {showSignatures.professional && (
                                <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas 
                                        onSave={(sig) => setChemical((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                                        initialImage={chemical.professionalSignature || professional.signature}
                                        title="Firma de Especialista H&S"
                                    />
                                </div>
                            )}

                            {showSignatures.supervisor && (
                                <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas 
                                        onSave={(sig) => setChemical((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                                        initialImage={chemical.supervisorSignature || chemical.signature}
                                        title="Firma de Supervisor / Cierre"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Botones de acción flotantes */}
            </main>

            <div className="no-print floating-action-bar">
                <button
                    onClick={() => requirePro(() => setShowShareModal(true))}
                    className="btn-floating-action"
                    style={{ background: '#0052CC', color: '#ffffff' }}
                >
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
                    onClick={() => requirePro(() => window.print())}
                    className="btn-floating-action"
                    style={{ background: '#FF8B00', color: '#ffffff' }}
                >
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); requirePro(handleSave); }}
                    className="btn-floating-action"
                    style={{ background: '#36B37E', color: '#ffffff' }}
                >
                    <Save size={18} /> GUARDAR FICHA
                </button>
            </div>

            <ShareModal
                isOpen={showShareModal}
                open={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Ficha Técnica Química"
                text={`Ficha de Seguridad: ${chemical.name}`}
                rawMessage={`Ficha de Seguridad: ${chemical.name}`}
                fileName={`Quimico_${chemical.name || 'Sin_Nombre'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: 0, opacity: 0.01, top: 0 }}>
                <ChemicalSafetyPdf data={{ ...chemical, id: (chemical as any).id || Date.now().toString(), createdAt: (chemical as any).createdAt || new Date().toISOString() }} />
            </div>
        </div>
    );
}

