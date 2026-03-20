import React from 'react';
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { XCircle, Lock } from 'lucide-react';


const ENERGY_TYPES = [
    { id: 'electrical', name: 'Eléctrica', icon: '⚡' },
    { id: 'mechanical', name: 'Mecánica', icon: '⚙️' },
    { id: 'hydraulic', name: 'Hidráulica', icon: '💧' },
    { id: 'pneumatic', name: 'Neumática', icon: '💨' },
    { id: 'thermal', name: 'Térmica', icon: '🔥' },
    { id: 'chemical', name: 'Química', icon: '🧪' },
    { id: 'gravitational', name: 'Gravitacional', icon: '📦' }
];

export default function LOTOCreate(): React.ReactElement | null {
        const [procedure, setProcedure] = useState({
        equipmentName: '',
        area: '',
        energyTypes: [],
        lockoutPoints: '',
        responsible: '',
        date: new Date().toISOString().split('T')[0],
        steps: '',
        observations: ''
    });

    const handleSave = () => {
        if (!procedure.equipmentName.trim()) return;
        const newProcedure = { ...procedure, id: `LOTO-${Date.now()}`, createdAt: new Date().toISOString(), status: 'active' };
        const saved = JSON.parse(localStorage.getItem('loto_procedures_db') || '[]');
        localStorage.setItem('loto_procedures_db', JSON.stringify([newProcedure, ...saved]));
        navigate('/loto?created=' + newProcedure.id);
    };

    const toggleEnergyType = (typeId) => {
        const current = procedure.energyTypes || [];
        const updated = current.includes(typeId) ? current.filter(t => t !== typeId) : [...current, typeId];
        setProcedure({ ...procedure, energyTypes: updated });
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem', maxWidth: '900px', paddingTop: '2rem' }}>
            <div style={{ marginBottom: '2.5rem', padding: '1.75rem', background: 'var(--gradient-card)', borderRadius: 'var(--radius-2xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #dc2626, #991b1b)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <XCircle size={32} color="#ffffff" onClick={() => navigate('/loto')} style={{ cursor: 'pointer' }} />
                    </div>
                    <div><h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.2 }}>Nuevo Procedimiento LOTO</h1><p style={{ margin: '0.5rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.4 }}>Completá los datos del procedimiento</p></div>
                </div>
            </div>
            <div className="card" style={{ padding: '2.5rem', paddingTop: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Nombre del Equipo *</label><input type="text" value={procedure.equipmentName} onChange={(e) => setProcedure({ ...procedure, equipmentName: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Área/Ubicación</label><input type="text" value={procedure.area} onChange={(e) => setProcedure({ ...procedure, area: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Responsable</label><input type="text" value={procedure.responsible} onChange={(e) => setProcedure({ ...procedure, responsible: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Fecha</label><input type="date" value={procedure.date} onChange={(e) => setProcedure({ ...procedure, date: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Puntos de Bloqueo</label><input type="text" value={procedure.lockoutPoints} onChange={(e) => setProcedure({ ...procedure, lockoutPoints: e.target.value })} style={inputStyle} /></div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={labelStyle}>Tipos de Energía</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                        {ENERGY_TYPES.map(type => (
                            <button key={type.id} onClick={() => toggleEnergyType(type.id)} style={{ padding: '1rem', background: procedure.energyTypes?.includes(type.id) ? '#dc262620' : 'var(--color-background)', border: `2px solid ${procedure.energyTypes?.includes(type.id) ? '#dc2626' : 'var(--color-border)'}`, borderRadius: 'var(--radius-lg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '2rem' }}>{type.icon}</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: procedure.energyTypes?.includes(type.id) ? '#dc2626' : 'var(--color-text)' }}>{type.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}><label style={labelStyle}>Pasos del Procedimiento</label><textarea value={procedure.steps} onChange={(e) => setProcedure({ ...procedure, steps: e.target.value })} style={{ ...inputStyle, minHeight: '100px' }} placeholder="Describí los pasos para el bloqueo..." /></div>
                <div style={{ marginBottom: '1.5rem' }}><label style={labelStyle}>Observaciones</label><textarea value={procedure.observations} onChange={(e) => setProcedure({ ...procedure, observations: e.target.value })} style={{ ...inputStyle, minHeight: '60px' }} /></div>
                <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                    <button onClick={() => navigate('/loto')} style={{ flex: 1, padding: '1rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', fontWeight: 700 }}>Cancelar</button>
                    <button onClick={handleSave} className="btn-primary" style={{ flex: 1 }}>Crear Procedimiento</button>
                </div>
            </div>
        </div>
    );
}
