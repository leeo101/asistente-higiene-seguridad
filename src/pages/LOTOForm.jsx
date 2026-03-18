import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Save } from 'lucide-react';

const ENERGY_TYPES = [
    { id: 'electrical', name: 'Eléctrica', icon: '⚡', color: '#fbbf24' },
    { id: 'mechanical', name: 'Mecánica', icon: '🔧', color: '#6b7280' },
    { id: 'hydraulic', name: 'Hidráulica', icon: '💧', color: '#3b82f6' },
    { id: 'pneumatic', name: 'Neumática', icon: '💨', color: '#9ca3af' },
    { id: 'chemical', name: 'Química', icon: '🧪', color: '#10b981' },
    { id: 'thermal', name: 'Térmica', icon: '🔥', color: '#ef4444' }
];

const LOTO_DEVICES = [
    { id: 'padlock', name: 'Candado', icon: '🔒' },
    { id: 'hasp', name: 'Grampa Múltiple', icon: '📎' },
    { id: 'breaker_lock', name: 'Bloqueo Interruptor', icon: '⚡' },
    { id: 'valve_lock', name: 'Bloqueo Válvula', icon: '🔩' },
    { id: 'tagout', name: 'Etiqueta', icon: '🏷️' }
];

export default function LOTOForm() {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);
    const [procedure, setProcedure] = useState({
        equipmentName: '',
        location: '',
        department: '',
        energyTypes: [],
        lotoDevices: [],
        supervisor: '',
        observations: ''
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleEnergy = (id) => {
        const updated = procedure.energyTypes.includes(id) 
            ? procedure.energyTypes.filter(e => e !== id) 
            : [...procedure.energyTypes, id];
        setProcedure({ ...procedure, energyTypes: updated });
    };

    const toggleDevice = (id) => {
        const updated = procedure.lotoDevices.includes(id) 
            ? procedure.lotoDevices.filter(d => d !== id) 
            : [...procedure.lotoDevices, id];
        setProcedure({ ...procedure, lotoDevices: updated });
    };

    const handleSave = () => {
        if (!procedure.equipmentName) {
            alert('Por favor complete el nombre del equipo');
            return;
        }

        const newEntry = {
            ...procedure,
            id: `LOTO-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };

        const currentData = JSON.parse(localStorage.getItem('loto_procedures_db') || '[]');
        localStorage.setItem('loto_procedures_db', JSON.stringify([newEntry, ...currentData]));
        
        navigate('/loto-page');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '2rem' }}>
            <div style={{
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                padding: '1rem 1.5rem',
                position: 'sticky',
                top: 0,
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
                        <Lock size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Nuevo Procedimiento LOTO
                    </h1>
                </div>
                <button
                    onClick={handleSave}
                    className="btn-primary"
                    style={{ width: 'auto', margin: 0, padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Save size={18} />
                    {!isMobile && 'Guardar'}
                </button>
            </div>

            <main style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '2rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Nombre del Equipo *</label>
                            <input type="text" value={procedure.equipmentName} onChange={(e) => setProcedure({ ...procedure, equipmentName: e.target.value })} style={inputStyle} placeholder="Ej: Compresor Principal" />
                        </div>
                        <div>
                            <label style={labelStyle}>Ubicación</label>
                            <input type="text" value={procedure.location} onChange={(e) => setProcedure({ ...procedure, location: e.target.value })} style={inputStyle} placeholder="Ej: Sala de Máquinas" />
                        </div>
                        <div>
                            <label style={labelStyle}>Departamento</label>
                            <input type="text" value={procedure.department} onChange={(e) => setProcedure({ ...procedure, department: e.target.value })} style={inputStyle} placeholder="Ej: Mantenimiento" />
                        </div>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Supervisor / Responsable</label>
                            <input type="text" value={procedure.supervisor} onChange={(e) => setProcedure({ ...procedure, supervisor: e.target.value })} style={inputStyle} placeholder="Nombre completo" />
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Fuentes de Energía</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '1rem' }}>
                            {ENERGY_TYPES.map(type => (
                                <button 
                                    key={type.id} 
                                    onClick={() => toggleEnergy(type.id)} 
                                    style={{ 
                                        padding: '1rem', 
                                        background: procedure.energyTypes.includes(type.id) ? `${type.color}15` : 'var(--color-background)', 
                                        border: `2px solid ${procedure.energyTypes.includes(type.id) ? type.color : 'var(--color-border)'}`, 
                                        borderRadius: 'var(--radius-xl)', 
                                        cursor: 'pointer', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        gap: '0.5rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span style={{ fontSize: '2rem' }}>{type.icon}</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: procedure.energyTypes.includes(type.id) ? type.color : 'var(--color-text-muted)' }}>{type.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Dispositivos de Bloqueo</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '1rem' }}>
                            {LOTO_DEVICES.map(device => (
                                <button 
                                    key={device.id} 
                                    onClick={() => toggleDevice(device.id)} 
                                    style={{ 
                                        padding: '1rem', 
                                        background: procedure.lotoDevices.includes(device.id) ? 'var(--color-primary)' : 'var(--color-background)', 
                                        color: procedure.lotoDevices.includes(device.id) ? '#fff' : 'var(--color-text)', 
                                        border: `2px solid ${procedure.lotoDevices.includes(device.id) ? 'var(--color-primary)' : 'var(--color-border)'}`, 
                                        borderRadius: 'var(--radius-xl)', 
                                        cursor: 'pointer', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.5rem', 
                                        fontWeight: 700,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span style={{ fontSize: '1.5rem' }}>{device.icon}</span>
                                    <span style={{ fontSize: '0.8rem' }}>{device.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <label style={labelStyle}>Instrucciones / Observaciones</label>
                        <textarea 
                            value={procedure.observations} 
                            onChange={(e) => setProcedure({ ...procedure, observations: e.target.value })} 
                            style={{ ...inputStyle, minHeight: '120px', paddingTop: '0.75rem' }} 
                            placeholder="Describa los pasos de bloqueo..."
                        />
                    </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <button 
                        onClick={() => navigate(-1)} 
                        style={{ 
                            flex: 1, 
                            padding: '1rem', 
                            background: 'var(--color-surface)', 
                            border: '1px solid var(--color-border)', 
                            borderRadius: 'var(--radius-lg)', 
                            fontWeight: 700, 
                            cursor: 'pointer',
                            color: 'var(--color-text)'
                        }}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="btn-primary" 
                        style={{ flex: 2, margin: 0 }}
                    >
                        Crear Procedimiento
                    </button>
                </div>
            </main>
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' };
const inputStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 500, outline: 'none', transition: 'all var(--transition-fast)', boxSizing: 'border-box' };
