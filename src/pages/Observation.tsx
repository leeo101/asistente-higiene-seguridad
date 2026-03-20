import React from 'react';

import { useNavigate, useLocation } from 'react-router-dom';
import React, { useState } from 'react';

import { ArrowLeft, Camera, Shield, Save, Clock, User } from 'lucide-react';

export default function Observation(): React.ReactElement | null {
    const navigate = useNavigate();
    const location = useLocation();
    const { itemId, category } = location.state || {};

    const [observation, setObservation] = useState({
        description: '',
        severity: 'Moderada',
        assignee: '',
        deadline: '48 horas',
        itemId: itemId || null,
        category: category || 'General'
    });

    const handleSave = () => {
        // Guardar la observación actual en el relevamiento
        const current = localStorage.getItem('current_inspection');
        if (current) {
            const inspection = JSON.parse(current);
            if (!inspection.observations) inspection.observations = [];
            
            // Si ya existe una observación para este ítem, la actualizamos
            const existingIdx = inspection.observations.findIndex(o => o.itemId === observation.itemId && observation.itemId !== null);
            
            const newObs = {
                ...observation,
                id: observation.id || Date.now(),
                timestamp: new Date().toISOString()
            };

            if (existingIdx >= 0) {
                inspection.observations[existingIdx] = newObs;
            } else {
                inspection.observations.push(newObs);
            }

            localStorage.setItem('current_inspection', JSON.stringify(inspection));
            console.log('[Observation] Saved finding. Observations count:', inspection.observations.length);
        }
        navigate('/photos', { state: { fromObservation: true, itemId: observation.itemId } });
    };

    return (
        <div className="container" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Registro de Hallazgo</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{category ? `Categoría: ${category}` : 'Observación planificada de seguridad'}</p>
                </div>
            </div>

            <div className="card">
                <div style={{ marginBottom: '1.5rem' }}>
                    <label>Descripción de la Anomalía</label>
                    <textarea
                        rows={4}
                        className="no-print block w-full"
                        placeholder="Detalle el riesgo observado..."
                        value={observation.description}
                        onInput={e => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onChange={(e) => setObservation({ ...observation, description: e.target.value })}
                        style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.8rem', color: 'var(--color-text)', outline: 'none' }}
                    />
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
                                    background: observation.severity === level ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                                    color: observation.severity === level ? 'var(--color-primary)' : 'var(--color-text)',
                                    fontWeight: observation.severity === level ? 600 : 400,
                                    cursor: 'pointer'
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
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)' }}
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
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)' }}
                    />
                    <datalist id="plazos">
                        <option value="Inmediato" />
                        <option value="24 horas" />
                        <option value="48 horas" />
                        <option value="7 días" />
                        <option value="Próxima visita" />
                    </datalist>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn-primary"
                        onClick={handleSave}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}
                    >
                        <Camera size={20} /> Tomar Foto
                    </button>
                    <button
                        className="btn-outline"
                        onClick={() => navigate('/risk', { state: { fromObservation: true, itemId: observation.itemId } })}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', background: 'transparent' }}
                    >
                        <Shield size={20} /> Evaluar Riesgo
                    </button>
                </div>
            </div>
        </div>
    );
}
