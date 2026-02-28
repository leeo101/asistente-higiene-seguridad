import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, ClipboardList, Play } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateInspection() {
    const navigate = useNavigate();
    const [project, setProject] = useState({
        name: '',
        location: '',
        type: 'Seguridad'
    });

    const handleStart = () => {
        if (!project.name) return toast.error('Ingrese el nombre de la obra/cliente');

        // Guardar sesión actual de inspección
        const inspectionSession = {
            ...project,
            id: Date.now().toString(),
            date: new Date().toISOString(),
            status: 'Iniciada'
        };
        localStorage.setItem('current_inspection', JSON.stringify(inspectionSession));

        navigate('/checklist');
    };

    return (
        <div className="container" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Nueva Inspección</h1>
            </div>

            <div className="card">
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={16} color="var(--color-primary)" /> Obra / Cliente
                    </label>
                    <input
                        list="obras-sugeridas"
                        placeholder="Nombre de la empresa u obra"
                        value={project.name}
                        onChange={(e) => setProject({ ...project, name: e.target.value })}
                        required
                    />
                    <datalist id="obras-sugeridas">
                        <option value="Edificio Alvear" />
                        <option value="Torre Madero" />
                        <option value="Planta Industrial Zárate" />
                    </datalist>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={16} color="var(--color-primary)" /> Ubicación / Sector
                    </label>
                    <input
                        placeholder="Ej: Planta 2 - Almacén"
                        value={project.location}
                        onChange={(e) => setProject({ ...project, location: e.target.value })}
                    />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ClipboardList size={16} color="var(--color-primary)" /> Tipo de Inspección
                    </label>
                    <input
                        list="tipos-inspeccion"
                        value={project.type}
                        onChange={(e) => setProject({ ...project, type: e.target.value })}
                    />
                    <datalist id="tipos-inspeccion">
                        <option value="Relevamiento General" />
                        <option value="Visita de Obra Semanal" />
                        <option value="Auditoría ISO 45001" />
                        <option value="Control de EPP" />
                    </datalist>
                </div>

                <button
                    className="btn-primary"
                    onClick={handleStart}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}
                >
                    Iniciar Relevamiento <Play size={20} fill="currentColor" />
                </button>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Al iniciar, se cargará automáticamente la lista de control seleccionada para este tipo de inspección.
                </p>
            </div>
        </div>
    );
}
