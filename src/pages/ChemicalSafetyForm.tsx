import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FlaskConical, Shield, AlertTriangle, Droplets, Flame, Skull, Zap, Wind, Thermometer, Radio, CheckCircle2, Eye, Printer, Share2 } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import ChemicalSafetyPdf from '../components/ChemicalSafetyPdf';

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
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [chemical, setChemical] = useState({
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
        }
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSave = () => {
        if (!chemical.name.trim()) {
            alert('Por favor ingrese el nombre del producto');
            return;
        }

        const newChemical = {
            ...chemical,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            status: 'active'
        };

                const updatedData = [newChemical, ...JSON.parse(localStorage.getItem('chemical_safety_db') || '[]')];
        localStorage.setItem('chemical_safety_db', JSON.stringify(updatedData));
        
        navigate('/chemical-safety-history');
    };

    const togglePictogram = (pictoId) => {
        const current = chemical.pictograms || [];
        const updated = current.includes(pictoId) 
            ? current.filter(p => p !== pictoId) 
            : [...current, pictoId];
        setChemical({ ...chemical, pictograms: updated });
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '2rem' }}>
            <div style={{
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                padding: '1rem 1.5rem',
                position: 'sticky',
                top: '5.5rem',
                zIndex: 100,
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        padding: '0.5rem',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        color: 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 900 }}>
                        <FlaskConical size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Nuevo Producto Químico
                    </h1>
                </div>
                {/* Header Buttons Removed as they are now in the floating bar */}
            </div>

            <main style={{ padding: '3.5rem 1.5rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '2rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)' }}>
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
                </div>

                {/* Botones de acción flotantes */}
            </main>

            <div className="no-print floating-action-bar">
                <button
                    onClick={() => setShowShareModal(true)}
                    className="btn-floating-action"
                    style={{ background: '#0052CC', color: '#ffffff' }}
                >
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
                    onClick={() => window.print()}
                    className="btn-floating-action"
                    style={{ background: '#FF8B00', color: '#ffffff' }}
                >
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
                <button
                    onClick={handleSave}
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

            <div className="print-only" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <ChemicalSafetyPdf data={{ ...chemical, id: (chemical as any).id || Date.now().toString(), createdAt: (chemical as any).createdAt || new Date().toISOString() }} />
            </div>
        </div>
    );
}

