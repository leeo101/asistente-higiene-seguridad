import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FlaskConical, ArrowLeft, Save, Printer, Share2, 
    AlertTriangle, CheckCircle2, XCircle, Info,
    Plus, Search, Filter, Shield, Droplets,
    Flame, Skull, Zap, Radioactive, Wind, Thermometer
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import ChemicalSafetyPdf from '../components/ChemicalSafetyPdf';

// Pictogramas GHS/SGA
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
    environmental: { icon: '🌊', name: 'Peligroso Ambiente', color: '#16a34a' },
    pressure: { icon: '📦', name: 'Gas a Presión', color: '#dc2626' }
};

const HAZARD_CATEGORIES = [
    { id: 'fisico', name: 'Peligro Físico', icon: '🔥' },
    { id: 'salud', name: 'Peligro para la Salud', icon: '🏥' },
    { id: 'ambiental', name: 'Peligro Ambiental', icon: '🌍' }
];

export default function ChemicalSafetyForm() {
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
        riskPhrases: [],
        safetyPhrases: [],
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
            alert('Por favor complete el nombre del producto (*)');
            return;
        }

        const newEntry = {
            ...chemical,
            id: `CHEM-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        const currentData = JSON.parse(localStorage.getItem('chemical_safety_db') || '[]');
        localStorage.setItem('chemical_safety_db', JSON.stringify([newEntry, ...currentData]));
        
        navigate('/chemical-safety-history');
    };

    const togglePictogram = (id) => {
        setChemical(prev => ({
            ...prev,
            pictograms: prev.pictograms.includes(id)
                ? prev.pictograms.filter(p => p !== id)
                : [...prev.pictograms, id]
        }));
    };

    const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' };
    const inputStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 500, outline: 'none', boxSizing: 'border-box' };

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
            </div>

            <main style={{ padding: '3.5rem 1.5rem 1.5rem', maxWidth: '900px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '2rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)' }}>
                    {/* Basic Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Nombre del Producto *</label>
                            <input type="text" value={chemical.name} onChange={(e) => setChemical({ ...chemical, name: e.target.value })} style={inputStyle} placeholder="Ej: Acetona / Ácido Sulfúrico" />
                        </div>
                        <div>
                            <label style={labelStyle}>Categoría Hazard</label>
                            <select value={chemical.category} onChange={(e) => setChemical({ ...chemical, category: e.target.value })} style={inputStyle}>
                                {HAZARD_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Número CAS</label>
                            <input type="text" value={chemical.casNumber} onChange={(e) => setChemical({ ...chemical, casNumber: e.target.value })} style={inputStyle} placeholder="Ej: 64-17-5" />
                        </div>
                        <div>
                            <label style={labelStyle}>Número UN</label>
                            <input type="text" value={chemical.unNumber} onChange={(e) => setChemical({ ...chemical, unNumber: e.target.value })} style={inputStyle} placeholder="Ej: UN 1090" />
                        </div>
                        <div>
                            <label style={labelStyle}>Proveedor</label>
                            <input type="text" value={chemical.supplier} onChange={(e) => setChemical({ ...chemical, supplier: e.target.value })} style={inputStyle} placeholder="Fabricante / Distribuidor" />
                        </div>
                        <div>
                            <label style={labelStyle}>Cantidad</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="number" value={chemical.quantity} onChange={(e) => setChemical({ ...chemical, quantity: e.target.value })} style={{ ...inputStyle, flex: 1 }} placeholder="0" />
                                <select value={chemical.unit} onChange={(e) => setChemical({ ...chemical, unit: e.target.value })} style={{ ...inputStyle, width: '80px' }}>
                                    <option value="L">L</option>
                                    <option value="Kg">Kg</option>
                                    <option value="m3">m3</option>
                                    <option value="Gal">Gal</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Ubicación</label>
                            <input type="text" value={chemical.location} onChange={(e) => setChemical({ ...chemical, location: e.target.value })} style={inputStyle} placeholder="Depósito / Sector" />
                        </div>
                        <div>
                            <label style={labelStyle}>Vencimiento</label>
                            <input type="date" value={chemical.expiryDate} onChange={(e) => setChemical({ ...chemical, expiryDate: e.target.value })} style={inputStyle} />
                        </div>
                    </div>

                    {/* Pictograms */}
                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Pictogramas GHS / SGA</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {Object.entries(GHS_PICTOGRAMS).map(([id, info]) => (
                                <button
                                    key={id}
                                    onClick={() => togglePictogram(id)}
                                    style={{
                                        padding: '1rem',
                                        background: chemical.pictograms.includes(id) ? `${info.color}15` : 'var(--color-surface)',
                                        border: `2px solid ${chemical.pictograms.includes(id) ? info.color : 'var(--color-border)'}`,
                                        borderRadius: 'var(--radius-lg)',
                                        cursor: 'pointer',
                                        fontSize: '1.5rem',
                                        transition: 'all 0.2s',
                                        position: 'relative',
                                        flex: '1 0 70px',
                                        maxWidth: '85px',
                                        textAlign: 'center'
                                    }}
                                    title={info.name}
                                >
                                    {info.icon}
                                    {chemical.pictograms.includes(id) && (
                                        <div style={{ position: 'absolute', top: '-5px', right: '-5px', background: info.color, color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <CheckCircle2 size={12} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* First Aid */}
                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Primeros Auxilios (SGA)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Por Inhalación</label>
                                <textarea value={chemical.firstAid.inhalation} onChange={(e) => setChemical({ ...chemical, firstAid: { ...chemical.firstAid, inhalation: e.target.value } })} style={{ ...inputStyle, minHeight: '60px' }} placeholder="Retirar al aire libre..." />
                            </div>
                            <div>
                                <label style={labelStyle}>Contacto Piel</label>
                                <textarea value={chemical.firstAid.skin} onChange={(e) => setChemical({ ...chemical, firstAid: { ...chemical.firstAid, skin: e.target.value } })} style={{ ...inputStyle, minHeight: '60px' }} placeholder="Lavar con abundante agua..." />
                            </div>
                            <div>
                                <label style={labelStyle}>Contacto Ojos</label>
                                <textarea value={chemical.firstAid.eyes} onChange={(e) => setChemical({ ...chemical, firstAid: { ...chemical.firstAid, eyes: e.target.value } })} style={{ ...inputStyle, minHeight: '60px' }} placeholder="Enjuagar por 15 min..." />
                            </div>
                            <div>
                                <label style={labelStyle}>Ingestión</label>
                                <textarea value={chemical.firstAid.ingestion} onChange={(e) => setChemical({ ...chemical, firstAid: { ...chemical.firstAid, ingestion: e.target.value } })} style={{ ...inputStyle, minHeight: '60px' }} placeholder="No inducir vómito..." />
                            </div>
                        </div>
                    </div>

                    {/* Storage & Precautions */}
                    <div style={{ marginTop: '2rem' }}>
                        <label style={labelStyle}>Almacenamiento y Precauciones</label>
                        <textarea 
                            value={chemical.storage} 
                            onChange={(e) => setChemical({ ...chemical, storage: e.target.value })} 
                            style={{ ...inputStyle, minHeight: '80px', paddingTop: '0.75rem' }} 
                            placeholder="Almacenar en lugar fresco y seco, lejos de oxidantes..."
                        />
                    </div>
                </div>
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
                    <Save size={18} /> GUARDAR PRODUCTO
                </button>
            </div>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Ficha SGA"
                fileName={`Ficha_Quimica_${chemical.name || 'Sin_Nombre'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                {chemical.name && <ChemicalSafetyPdf data={{ ...chemical, createdAt: new Date().toISOString() }} />}
            </div>
        </div>
    );
}
