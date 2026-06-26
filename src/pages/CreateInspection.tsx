import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, ClipboardList, Play } from 'lucide-react';
import LocationPicker from '../components/LocationPicker';
import toast from 'react-hot-toast';

export default function CreateInspection(): React.ReactElement | null {
  const navigate = useNavigate();
  const [project, setProject] = useState({
    name: '',
    location: '',
    type: 'Seguridad',
    gpsLocation: null
  });

  const handleStart = () => {
    if (!project.name) return toast.error('Ingrese el nombre de la obra/cliente');

    // Guardar sesión actual de inspección
    const inspectionSession = {
      ...project,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      status: 'Iniciada',
      // Geolocalización
      latitude: project.gpsLocation?.latitude || null,
      longitude: project.gpsLocation?.longitude || null,
      locationAccuracy: project.gpsLocation?.accuracy || null,
      locationAddress: project.gpsLocation?.address || null
    };
    localStorage.setItem('current_inspection', JSON.stringify(inspectionSession));

    navigate('/checklist');
  };

  return (
    <div className="container max-w-[600px]">
            <div className="flex items-center gap-[1rem] mb-[2rem]">
                <></>
                <h1 className="m-[0] text-[1.5rem]">Nueva Inspección</h1>
            </div>

            <div className="card">
                <div className="mb-6">
                    <label className="flex items-center gap-[0.5rem]">
                        <Building2 size={16} color="var(--color-primary)" /> Obra / Cliente
                    </label>
                    <input
            list="obras-sugeridas"
            placeholder="Nombre de la empresa u obra"
            value={project.name}
            onChange={(e) => setProject({ ...project, name: e.target.value })}
            required />
          
                    <datalist id="obras-sugeridas">
                        <option value="Edificio Alvear" />
                        <option value="Torre Madero" />
                        <option value="Planta Industrial Zárate" />
                    </datalist>
                </div>

                <div className="mb-6">
                    <label className="flex items-center gap-[0.5rem]">
                        <MapPin size={16} color="var(--color-primary)" /> Ubicación / Sector
                    </label>
                    <input
            placeholder="Ej: Planta 2 - Almacén"
            value={project.location}
            onChange={(e) => setProject({ ...project, location: e.target.value })} />
          
                </div>

                <div className="mb-8">
                    <label className="flex items-center gap-[0.5rem]">
                        <ClipboardList size={16} color="var(--color-primary)" /> Tipo de Inspección
                    </label>
                    <input
            list="tipos-inspeccion"
            value={project.type}
            onChange={(e) => setProject({ ...project, type: e.target.value })} />
          
                    <datalist id="tipos-inspeccion">
                        <option value="Relevamiento General" />
                        <option value="Visita de Obra Semanal" />
                        <option value="Auditoría ISO 45001" />
                        <option value="Control de EPP" />
                    </datalist>
                </div>

                {/* Geolocalización */}
                <LocationPicker
          initialLocation={null}
          onLocationSelect={(location) => {
            setProject({ ...project, gpsLocation: location });
          }} />
        

                <div className="flex flex-col gap-4">
                    <button
            className="btn-primary flex items-center justify-center gap-[0.8rem]"
            onClick={handleStart}>

            
                        Iniciar Relevamiento <Play size={20} fill="currentColor" />
                    </button>

                    <button
            className="btn-outline flex items-center justify-center gap-[0.8rem] border-color-[var(--color-primary)] text-[var(--color-primary)]"
            onClick={() => navigate('/risk', { state: { fromInspection: true } })}>

            
                        Evaluación de Riesgo Previa
                    </button>
                </div>
            </div>

            <div className="mt-[2rem] text-center">
                <p className="text-[0.8rem] text-[var(--color-text-muted)]">
                    Al iniciar, se cargará automáticamente la lista de control seleccionada para este tipo de inspección.
                </p>
            </div>
        </div>);

}