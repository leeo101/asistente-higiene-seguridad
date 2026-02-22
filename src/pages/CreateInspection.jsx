import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FileText } from 'lucide-react';

export default function CreateInspection() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nombre: '',
        obra: '',
        tipo: 'Rutina'
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // Guardar sesión actual de inspección
        const inspectionSession = {
            id: Date.now().toString(),
            name: formData.nombre,
            location: formData.obra,
            type: formData.tipo,
            date: new Date().toISOString(),
            status: 'Iniciada'
        };
        localStorage.setItem('current_inspection', JSON.stringify(inspectionSession));

        navigate('/checklist');
    };

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 4rem)' }}>
            <h1 style={{ marginBottom: '1.5rem' }}>Nueva Inspección</h1>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="nombre" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Nombre de la Inspección</label>
                    <input
                        type="text"
                        id="nombre"
                        placeholder="Ej: Control Semanal de EPP"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                        style={{ marginBottom: '1.5rem' }}
                    />

                    <label htmlFor="obra" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Obra</label>
                    <input
                        type="text"
                        id="obra"
                        placeholder="Ej: Edificio Alvear o Calle Falsa 123"
                        value={formData.obra}
                        onChange={(e) => setFormData({ ...formData, obra: e.target.value })}
                        required
                        style={{ marginBottom: '1.5rem' }}
                    />

                    <label htmlFor="tipo" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Tipo de Inspección</label>
                    <input
                        list="tipos-inspeccion"
                        id="tipo"
                        placeholder="Ej: Rutina, Denuncia, Auditoría..."
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        style={{ marginBottom: '1.5rem' }}
                    />
                    <datalist id="tipos-inspeccion">
                        <option value="Rutina" />
                        <option value="Denuncia" />
                        <option value="Accidente" />
                        <option value="Auditoria" />
                    </datalist>

                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Fecha y Hora</label>
                    <input type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} />
                </div>


                <button type="submit" className="btn-primary" style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}>
                    Comenzar Relevamiento <ChevronRight size={20} />
                </button>
            </form>
        </div>
    );
}
