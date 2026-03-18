import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, FlaskConical } from 'lucide-react';

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

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' };
const inputStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 500, outline: 'none', transition: 'all var(--transition-fast)', boxSizing: 'border-box' };

export default function ChemicalSafetyCreate() {
    const navigate = useNavigate();
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

    const handleSave = () => {
        if (!chemical.name.trim()) return;

        const newChemical = {
            ...chemical,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        const saved = JSON.parse(localStorage.getItem('chemical_safety_db') || '[]');
        const updated = [newChemical, ...saved];
        localStorage.setItem('chemical_safety_db', JSON.stringify(updated));
        
        navigate('/chemical-safety?created=' + newChemical.id);
    };

    const togglePictogram = (pictoId) => {
        const current = chemical.pictograms || [];
        const updated = current.includes(pictoId) 
            ? current.filter(p => p !== pictoId) 
            : [...current, pictoId];
        setChemical({ ...chemical, pictograms: updated });
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem', maxWidth: '1000px' }}>
            {/* Header */}
            <div style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'var(--gradient-card)',
                borderRadius: 'var(--radius-2xl)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                    }}>
                        <XCircle size={32} color="#ffffff" strokeWidth={2} onClick={() => navigate('/chemical-safety')} style={{ cursor: 'pointer' }} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>Nuevo Producto Químico</h1>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Completá los datos del producto</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Nombre del Producto *</label><input type="text" value={chemical.name} onChange={(e) => setChemical({ ...chemical, name: e.target.value })} style={inputStyle} placeholder="Ej: Acetona" /></div>
                    <div><label style={labelStyle}>Número CAS</label><input type="text" value={chemical.casNumber} onChange={(e) => setChemical({ ...chemical, casNumber: e.target.value })} style={inputStyle} placeholder="Ej: 67-64-1" /></div>
                    <div><label style={labelStyle}>Número UN</label><input type="text" value={chemical.unNumber} onChange={(e) => setChemical({ ...chemical, unNumber: e.target.value })} style={inputStyle} placeholder="Ej: UN1090" /></div>
                    <div><label style={labelStyle}>Categoría</label><select value={chemical.category} onChange={(e) => setChemical({ ...chemical, category: e.target.value })} style={inputStyle}>{HAZARD_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}</select></div>
                    <div><label style={labelStyle}>Ubicación</label><input type="text" value={chemical.location} onChange={(e) => setChemical({ ...chemical, location: e.target.value })} style={inputStyle} placeholder="Ej: Almacén A" /></div>
                    <div><label style={labelStyle}>Cantidad</label><input type="text" value={chemical.quantity} onChange={(e) => setChemical({ ...chemical, quantity: e.target.value })} style={inputStyle} placeholder="Ej: 100" /></div>
                    <div><label style={labelStyle}>Unidad</label><select value={chemical.unit} onChange={(e) => setChemical({ ...chemical, unit: e.target.value })} style={inputStyle}><option value="L">Litros</option><option value="kg">Kilogramos</option><option value="g">Gramos</option><option value="mL">Mililitros</option><option value="und">Unidades</option></select></div>
                    <div><label style={labelStyle}>Proveedor</label><input type="text" value={chemical.supplier} onChange={(e) => setChemical({ ...chemical, supplier: e.target.value })} style={inputStyle} placeholder="Nombre del proveedor" /></div>
                    <div><label style={labelStyle}>Fecha SDS</label><input type="date" value={chemical.sdsDate} onChange={(e) => setChemical({ ...chemical, sdsDate: e.target.value })} style={inputStyle} /></div>
                </div>

                {/* Pictogramas */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={labelStyle}>Pictogramas GHS</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                        {Object.entries(GHS_PICTOGRAMS).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => togglePictogram(key)}
                                style={{
                                    padding: '1rem',
                                    background: chemical.pictograms?.includes(key) ? `${config.color}20` : 'var(--color-background)',
                                    border: `2px solid ${chemical.pictograms?.includes(key) ? config.color : 'var(--color-border)'}`,
                                    borderRadius: 'var(--radius-lg)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all var(--transition-fast)'
                                }}
                            >
                                <span style={{ fontSize: '2.5rem' }}>{config.icon}</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: chemical.pictograms?.includes(key) ? config.color : 'var(--color-text)' }}>{config.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Almacenamiento */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={labelStyle}>Condiciones de Almacenamiento</label>
                    <textarea value={chemical.storage} onChange={(e) => setChemical({ ...chemical, storage: e.target.value })} style={{ ...inputStyle, minHeight: '80px' }} placeholder="Ej: Mantener en lugar fresco y seco, alejado de fuentes de ignición..." />
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                    <button onClick={() => navigate('/chemical-safety')} style={{ flex: 1, padding: '1rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>Cancelar</button>
                    <button onClick={handleSave} className="btn-primary" style={{ flex: 1, fontSize: '1rem' }}>Guardar Producto</button>
                </div>
            </div>
        </div>
    );
}
