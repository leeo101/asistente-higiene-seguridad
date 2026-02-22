import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, FileText, Calendar, User, Save } from 'lucide-react';

export default function Observation() {
    const navigate = useNavigate();
    const [observation, setObservation] = useState({
        description: '',
        location: '',
        severity: 'Media',
        assignedTo: '',
        deadline: ''
    });

    const handleSave = () => {
        alert('Observación guardada');
        navigate('/risk'); // Flujo sugerido: Obs -> Riesgo o volver al Checklist
    };

    return (
        <div className="container">
            <h1>Registrar Observación</h1>

            <div className="card">
                <label htmlFor="desc">Descripción del Hallazgo</label>
                <textarea
                    id="desc"
                    rows={4}
                    placeholder="Describa el incumplimiento o condición insegura..."
                    value={observation.description}
                    onChange={(e) => setObservation({ ...observation, description: e.target.value })}
                />

                <label htmlFor="loc">Ubicación Exacta</label>
                <input
                    type="text"
                    id="loc"
                    placeholder="Ej: Piso 3, Sector Norte"
                    value={observation.location}
                    onChange={(e) => setObservation({ ...observation, location: e.target.value })}
                />

                <label htmlFor="sev">Gravedad</label>
                <select
                    id="sev"
                    value={observation.severity}
                    onChange={(e) => setObservation({ ...observation, severity: e.target.value })}
                >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Critica">Crítica (Riesgo Inminente)</option>
                </select>

                <label htmlFor="assign">Asignar a (Responsable)</label>
                <input
                    list="responsables-lista"
                    id="assign"
                    placeholder="Ej: Capataz, Juan Pérez, Contratista..."
                    value={observation.assignedTo}
                    onChange={(e) => setObservation({ ...observation, assignedTo: e.target.value })}
                />
                <datalist id="responsables-lista">
                    <option value="Capataz General" />
                    <option value="Contratista Electricidad" />
                    <option value="Contratista Sanitario" />
                    <option value="Jefe de Obra" />
                </datalist>

                <label htmlFor="deadline">Plazo de Solución</label>
                <input
                    list="plazos-lista"
                    id="deadline"
                    placeholder="Ej: Inmediato, 24 horas, 1 semana..."
                    value={observation.deadline}
                    onChange={(e) => setObservation({ ...observation, deadline: e.target.value })}
                />
                <datalist id="plazos-lista">
                    <option value="Inmediato" />
                    <option value="24 Horas" />
                    <option value="48 Horas" />
                    <option value="1 Semana" />
                </datalist>

                <button
                    type="button"
                    onClick={() => navigate('/photos')}
                    style={{ width: '100%', padding: '1rem', border: '1px dashed var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}
                >
                    <Camera size={32} />
                    Adjuntar Nueva Foto
                </button>
            </div>

            <button className="btn-primary" onClick={handleSave} style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <Save size={20} /> Guardar y Evaluar Riesgo
            </button>
        </div>
    );
}
