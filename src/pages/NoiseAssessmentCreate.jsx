import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, Volume2 } from 'lucide-react';

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' };
const inputStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 500, outline: 'none', boxSizing: 'border-box' };

export default function NoiseAssessmentCreate() {
    const navigate = useNavigate();
    const [measurement, setMeasurement] = useState({
        location: '',
        area: '',
        levelDb: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        equipment: '',
        technician: '',
        observations: ''
    });

    const handleSave = () => {
        if (!measurement.location.trim()) return;
        const newMeasurement = { ...measurement, id: `NA-${Date.now()}`, createdAt: new Date().toISOString() };
        const saved = JSON.parse(localStorage.getItem('noise_assessments_db') || '[]');
        localStorage.setItem('noise_assessments_db', JSON.stringify([newMeasurement, ...saved]));
        navigate('/noise-assessment?created=' + newMeasurement.id);
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem', maxWidth: '900px', paddingTop: '2rem' }}>
            <div style={{ marginBottom: '2.5rem', padding: '1.75rem', background: 'var(--gradient-card)', borderRadius: 'var(--radius-2xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <XCircle size={32} color="#ffffff" onClick={() => navigate('/noise-assessment')} style={{ cursor: 'pointer' }} />
                    </div>
                    <div><h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.2 }}>Nueva Medición de Ruido</h1><p style={{ margin: '0.5rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.4 }}>Completá los datos de la medición</p></div>
                </div>
            </div>
            <div className="card" style={{ padding: '2.5rem', paddingTop: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Ubicación *</label><input type="text" value={measurement.location} onChange={(e) => setMeasurement({ ...measurement, location: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Área/Departamento</label><input type="text" value={measurement.area} onChange={(e) => setMeasurement({ ...measurement, area: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Nivel (dB) *</label><input type="number" value={measurement.levelDb} onChange={(e) => setMeasurement({ ...measurement, levelDb: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Fecha</label><input type="date" value={measurement.date} onChange={(e) => setMeasurement({ ...measurement, date: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Hora</label><input type="time" value={measurement.time} onChange={(e) => setMeasurement({ ...measurement, time: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Equipo de Medición</label><input type="text" value={measurement.equipment} onChange={(e) => setMeasurement({ ...measurement, equipment: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Técnico</label><input type="text" value={measurement.technician} onChange={(e) => setMeasurement({ ...measurement, technician: e.target.value })} style={inputStyle} /></div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}><label style={labelStyle}>Observaciones</label><textarea value={measurement.observations} onChange={(e) => setMeasurement({ ...measurement, observations: e.target.value })} style={{ ...inputStyle, minHeight: '80px' }} /></div>
                <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                    <button onClick={() => navigate('/noise-assessment')} style={{ flex: 1, padding: '1rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', fontWeight: 700 }}>Cancelar</button>
                    <button onClick={handleSave} className="btn-primary" style={{ flex: 1 }}>Guardar Medición</button>
                </div>
            </div>
        </div>
    );
}
