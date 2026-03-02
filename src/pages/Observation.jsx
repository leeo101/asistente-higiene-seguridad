import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Shield, Save, Clock, User } from 'lucide-react';

export default function Observation() {
    const navigate = useNavigate();
    const [observation, setObservation] = useState({
        description: '',
        severity: 'Moderada',
        assignee: '',
        deadline: '48 horas'
    });

    const handleSave = () => {
        // Guardar la observación actual en el relevamiento
        const current = localStorage.getItem('current_inspection');
        if (current) {
            const inspection = JSON.parse(current);
            if (!inspection.observations) inspection.observations = [];
            inspection.observations.push({
                ...observation,
                id: Date.now(),
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('current_inspection', JSON.stringify(inspection));
        }
        navigate('/photos');
    };

    return (
        <div className="container" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Registro de Hallazgo</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Observación planificada de seguridad</p>
                </div>
            </div>

            <div className="card">
                <div style={{ marginBottom: '1.5rem' }}>
                    <label>Descripción de la Anomalía</label>
                    <textarea
                        rows={4}
                        className="no-print block overflow-hidden w-full"
                        placeholder="Detalle el riesgo observado..."
                        value={observation.description}
                        onInput={e => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onChange={(e) => setObservation({ ...observation, description: e.target.value })}
                    />
                    <div className="print-only whitespace-pre-wrap break-words mt-2 font-semibold">
                        {observation.description || 'Sin descripción detallada.'}
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label>Severidad del Riesgo</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['Leve', 'Moderada', 'Crítica'].map(level => (
                            <button
                                key={level}
                                onClick={() => setObservation({ ...observation, severity: level })}
                                style={{
                                    flex: 1,
                                    padding: '0.8rem',
                                    borderRadius: '8px',
                                    border: `1px solid ${observation.severity === level ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    background: observation.severity === level ? 'var(--color-primary-light)' : 'transparent',
                                    color: observation.severity === level ? 'var(--color-primary)' : 'var(--color-text)',
                                    fontWeight: observation.severity === level ? 600 : 400
                                }}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={16} /> Responsable de Solución
                    </label>
                    <input
                        list="responsables"
                        placeholder="Nombre del responsable"
                        value={observation.assignee}
                        onChange={(e) => setObservation({ ...observation, assignee: e.target.value })}
                    />
                    <datalist id="responsables">
                        <option value="Jefe de Obra" />
                        <option value="Capataz" />
                        <option value="Responsable de Mantenimiento" />
                        <option value="Contratista General" />
                    </datalist>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} /> Plazo de Solución
                    </label>
                    <input
                        list="plazos"
                        value={observation.deadline}
                        onChange={(e) => setObservation({ ...observation, deadline: e.target.value })}
                    />
                    <datalist id="plazos">
                        <option value="Inmediato" />
                        <option value="24 horas" />
                        <option value="48 horas" />
                        <option value="7 días" />
                        <option value="Próxima visita" />
                    </datalist>
                </div>

                <div className="flex-res">
                    <button
                        className="btn-primary"
                        onClick={handleSave}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <Camera size={20} /> Tomar Foto
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => navigate('/risk-assessment')}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <Shield size={20} /> Evaluar Riesgo
                    </button>
                </div>
            </div>
        </div>
    );
}
