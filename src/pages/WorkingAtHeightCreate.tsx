import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, HardHat } from 'lucide-react';


export default function WorkingAtHeightCreate(): React.ReactElement | null {
    const navigate = useNavigate();
    const [permit, setPermit] = useState<any>({
        location: '',
        worker: '',
        supervisor: '',
        date: new Date().toISOString().split('T')[0],
        height: '',
        workType: '',
        hasHarness: false,
        hasAnchor: false,
        hasLifeline: false,
        observations: ''
    });

    const handleSave = () => {
        if (!permit.location.trim()) return;
        const newPermit = { ...permit, id: `WAH-${Date.now()}`, createdAt: new Date().toISOString(), status: 'active' };
        const saved = JSON.parse(localStorage.getItem('working_at_height_permits') || '[]');
        localStorage.setItem('working_at_height_permits', JSON.stringify([newPermit, ...saved]));
        navigate('/working-height?created=' + newPermit.id);
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem', maxWidth: '900px', paddingTop: '2rem' }}>
            <div style={{ marginBottom: '2.5rem', padding: '1.75rem', background: 'var(--gradient-card)', borderRadius: 'var(--radius-2xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #dc2626, #991b1b)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <XCircle size={32} color="#ffffff" onClick={() => navigate('/working-height')} style={{ cursor: 'pointer' }} />
                    </div>
                    <div><h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.2 }}>Nuevo Permiso - Trabajo en Altura</h1><p style={{ margin: '0.5rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.4 }}>Completá los datos del permiso</p></div>
                </div>
            </div>
            <div className="card" style={{ padding: '2.5rem', paddingTop: '2rem' }}>
                {/* Sección: Info del Permiso */}
                <div className="form-section">
                    <div className="form-section-header">
                        <div className="section-bar" style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }} />
                        <span className="section-title">Información del Permiso</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Ubicación *</label><input className="input-professional" type="text" value={permit.location} onChange={(e) => setPermit({ ...permit, location: e.target.value })} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Trabajador</label><input className="input-professional" type="text" value={permit.worker} onChange={(e) => setPermit({ ...permit, worker: e.target.value })} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Supervisor</label><input className="input-professional" type="text" value={permit.supervisor} onChange={(e) => setPermit({ ...permit, supervisor: e.target.value })} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Fecha</label><input className="input-professional" type="date" value={permit.date} onChange={(e) => setPermit({ ...permit, date: e.target.value })} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Altura (metros)</label><input className="input-professional" type="number" value={permit.height} onChange={(e) => setPermit({ ...permit, height: e.target.value })} style={inputStyle} /></div>
                        <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Tipo de Trabajo</label><input className="input-professional" type="text" value={permit.workType} onChange={(e) => setPermit({ ...permit, workType: e.target.value })} style={inputStyle} /></div>
                    </div>
                </div>

                {/* Sección: Equipos de Protección */}
                <div className="form-section">
                    <div className="form-section-header">
                        <div className="section-bar" style={{ background: 'linear-gradient(135deg, #16a34a, #059669)' }} />
                        <span className="section-title">Equipos de Protección</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {['hasHarness', 'hasAnchor', 'hasLifeline'].map((key, i) => (
                            <label key={key} style={{ padding: '1rem', background: (permit as any)[key] ? '#16a34a20' : 'var(--color-background)', border: `2px solid ${(permit as any)[key] ? '#16a34a' : 'var(--color-border)'}`, borderRadius: 'var(--radius-lg)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all var(--transition-fast)' }}>
                                <input type="checkbox" checked={(permit as any)[key]} onChange={(e) => setPermit({ ...permit, [key]: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                <span style={{ fontWeight: 600 }}>{['Arnés', 'Anclaje', 'Línea de Vida'][i]}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Sección: Observaciones */}
                <div className="form-section">
                    <div className="form-section-header">
                        <div className="section-bar" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }} />
                        <span className="section-title">Observaciones</span>
                    </div>
                    <div><label style={labelStyle}>Notas del Permiso</label><textarea className="input-professional" value={permit.observations} onChange={(e) => setPermit({ ...permit, observations: e.target.value })} style={{ ...inputStyle, minHeight: '60px' }} /></div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                    <button onClick={() => navigate('/working-height')} style={{ flex: 1, padding: '1rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', fontWeight: 700 }}>Cancelar</button>
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
