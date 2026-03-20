import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, Package } from 'lucide-react';


export default function ConfinedSpaceCreate(): React.ReactElement | null {
    const navigate = useNavigate();
    const [permit, setPermit] = useState<any>({
        location: '',
        supervisor: '',
        workers: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        atmosphericTests: false,
        ventilation: false,
        communication: false,
        rescue: false,
        observations: ''
    });

    const handleSave = () => {
        if (!permit.location.trim()) return;

        const newPermit = {
            ...permit,
            id: `CS-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        const saved = JSON.parse(localStorage.getItem('confined_space_permits') || '[]');
        const updated = [newPermit, ...saved];
        localStorage.setItem('confined_space_permits', JSON.stringify(updated));
        
        navigate('/confined-space?created=' + newPermit.id);
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem', maxWidth: '900px', paddingTop: '2rem' }}>
            <div style={{ marginBottom: '2.5rem', padding: '1.75rem', background: 'var(--gradient-card)', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <XCircle size={32} color="#ffffff" onClick={() => navigate('/confined-space')} style={{ cursor: 'pointer' }} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.2 }}>Nuevo Permiso - Espacio Confinado</h1>
                        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.4 }}>Completá los datos del permiso</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '2.5rem', paddingTop: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Ubicación *</label><input type="text" value={permit.location} onChange={(e) => setPermit({ ...permit, location: e.target.value })} style={inputStyle} placeholder="Ej: Tanque de Agua #3" /></div>
                    <div><label style={labelStyle}>Supervisor</label><input type="text" value={permit.supervisor} onChange={(e) => setPermit({ ...permit, supervisor: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Trabajadores</label><input type="text" value={permit.workers} onChange={(e) => setPermit({ ...permit, workers: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Fecha</label><input type="date" value={permit.date} onChange={(e) => setPermit({ ...permit, date: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Hora Inicio</label><input type="time" value={permit.startTime} onChange={(e) => setPermit({ ...permit, startTime: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Hora Fin</label><input type="time" value={permit.endTime} onChange={(e) => setPermit({ ...permit, endTime: e.target.value })} style={inputStyle} /></div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={labelStyle}>Verificaciones de Seguridad</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <label style={{ padding: '1rem', background: permit.atmosphericTests ? '#16a34a20' : 'var(--color-background)', border: `2px solid ${permit.atmosphericTests ? '#16a34a' : 'var(--color-border)'}`, borderRadius: 'var(--radius-lg)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <input type="checkbox" checked={permit.atmosphericTests} onChange={(e) => setPermit({ ...permit, atmosphericTests: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                            <span style={{ fontWeight: 600 }}>Pruebas Atmosféricas</span>
                        </label>
                        <label style={{ padding: '1rem', background: permit.ventilation ? '#16a34a20' : 'var(--color-background)', border: `2px solid ${permit.ventilation ? '#16a34a' : 'var(--color-border)'}`, borderRadius: 'var(--radius-lg)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <input type="checkbox" checked={permit.ventilation} onChange={(e) => setPermit({ ...permit, ventilation: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                            <span style={{ fontWeight: 600 }}>Ventilación Adecuada</span>
                        </label>
                        <label style={{ padding: '1rem', background: permit.communication ? '#16a34a20' : 'var(--color-background)', border: `2px solid ${permit.communication ? '#16a34a' : 'var(--color-border)'}`, borderRadius: 'var(--radius-lg)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <input type="checkbox" checked={permit.communication} onChange={(e) => setPermit({ ...permit, communication: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                            <span style={{ fontWeight: 600 }}>Comunicación Establecida</span>
                        </label>
                        <label style={{ padding: '1rem', background: permit.rescue ? '#16a34a20' : 'var(--color-background)', border: `2px solid ${permit.rescue ? '#16a34a' : 'var(--color-border)'}`, borderRadius: 'var(--radius-lg)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <input type="checkbox" checked={permit.rescue} onChange={(e) => setPermit({ ...permit, rescue: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                            <span style={{ fontWeight: 600 }}>Plan de Rescate</span>
                        </label>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={labelStyle}>Observaciones</label>
                    <textarea value={permit.observations} onChange={(e) => setPermit({ ...permit, observations: e.target.value })} style={{ ...inputStyle, minHeight: '80px' }} placeholder="Observaciones adicionales..." />
                </div>

                <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                    <button onClick={() => navigate('/confined-space')} style={{ flex: 1, padding: '1rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={handleSave} className="btn-primary" style={{ flex: 1 }}>Crear Permiso</button>
                </div>
            </div>
        </div>
    );
}

const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    marginBottom: '0.5rem'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-input-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontSize: '0.95rem',
    fontWeight: 500,
    outline: 'none',
    transition: 'all var(--transition-fast)',
    boxSizing: 'border-box'
};
