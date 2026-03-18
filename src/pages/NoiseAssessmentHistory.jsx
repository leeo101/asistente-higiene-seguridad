import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Volume2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NoiseAssessmentHistory() {
    useDocumentTitle('Evaluación de Ruido');
    const navigate = useNavigate();

    const [measurements, setMeasurements] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('noise_assessments_db') || '[]');
        setMeasurements(stored);
    }, []);

    const filteredMeasurements = measurements.filter(m => {
        const matchesSearch = m.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.area?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const stats = {
        total: measurements.length,
        altos: measurements.filter(m => m.levelDb && m.levelDb > 85).length,
        normales: measurements.filter(m => m.levelDb && m.levelDb <= 85).length
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/noise-assessment')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: 'var(--radius-full)', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Evaluación de Ruido</h1>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{stats.total} mediciones • {stats.altos} peligrosos</p>
                    </div>
                </div>
                <button onClick={() => navigate('/noise-assessment')} className="btn-primary" style={{ margin: 0, padding: '0.75rem 1.25rem' }}>
                    Nueva Medición
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard label="Total" value={stats.total} color="#3B82F6" icon={<Volume2 size={20} />} />
                <StatCard label=">85 dB" value={stats.altos} color="#dc2626" icon={<AlertTriangle size={20} />} />
                <StatCard label="≤85 dB" value={stats.normales} color="#16a34a" icon={<CheckCircle2 size={20} />} />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input type="text" placeholder="Buscar por ubicación, área..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', outline: 'none' }} />
                </div>
            </div>

            {filteredMeasurements.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Volume2 size={48} color="var(--color-text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>No hay mediciones de ruido</p>
                    <button onClick={() => navigate('/noise-assessment')} className="btn-primary" style={{ marginTop: '1rem' }}>Primera Medición</button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredMeasurements.map(m => (<MeasurementCard key={m.id} measurement={m} onClick={() => navigate(`/noise-assessment/${m.id}`)} />))}
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, color, icon }) {
    return (<div className="card" style={{ padding: '1.25rem', background: 'var(--gradient-card)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}><span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</span><div style={{ color }}>{icon}</div></div><div style={{ fontSize: '2rem', fontWeight: 900, color }}>{value}</div></div>);
}

function MeasurementCard({ measurement, onClick }) {
    const isDangerous = measurement.levelDb && measurement.levelDb > 85;
    return (
        <div onClick={onClick} className="card" style={{ padding: '1.25rem', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ width: '48px', height: '48px', background: isDangerous ? '#dc262620' : '#16a34a20', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDangerous ? '#dc2626' : '#16a34a' }}><Volume2 size={24} /></div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700 }}>{measurement.location || 'Sin ubicación'}</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{measurement.area || 'Sin área'} • {measurement.date ? new Date(measurement.date).toLocaleDateString() : 'Sin fecha'}</p>
                    </div>
                </div>
                <span style={{ padding: '0.35rem 0.75rem', background: isDangerous ? '#dc262620' : '#16a34a20', color: isDangerous ? '#dc2626' : '#16a34a', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 800 }}>{measurement.levelDb || '-'} dB</span>
            </div>
        </div>
    );
}
