import React, { useState } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { useNavigate, useLocation } from 'react-router-dom';

import { ArrowLeft, Camera, Shield, Save, Clock, User } from 'lucide-react';

export default function Observation(): React.ReactElement | null {
  const { requirePro } = usePaywall();
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
      const existingIdx = inspection.observations.findIndex((o) => o.itemId === observation.itemId && observation.itemId !== null);

      const newObs = {
        ...observation,
        id: (observation as any).id || Date.now(),
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
    <div className="container max-w-[600px]">
            <div className="flex items-center gap-[1rem] mb-[2rem]">
                <></>
                <div>
                    <h1 className="m-[0] text-[1.5rem] font-[700]">Registro de Hallazgo</h1>
                    <p className="m-[0] text-[0.85rem] text-[var(--color-text-muted)]">{category ? `Categoría: ${category}` : 'Observación planificada de seguridad'}</p>
                </div>
            </div>

            <div className="card">
                <div className="mb-6">
                    <label>Descripción de la Anomalía</label>
                    <textarea
            rows={4}
            className="no-print block w-full bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[8px] p-[0.8rem] text-[var(--color-text)] outline-[none]"
            placeholder="Detalle el riesgo observado..."
            value={observation.description}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = 'auto';
              t.style.height = t.scrollHeight + 'px';
            }}
            onChange={(e) => setObservation({ ...observation, description: e.target.value })} />

          
                </div>

                <div className="mb-6">
                    <label>Severidad del Riesgo</label>
                    <div className="flex gap-[0.5rem]">
                        {['Leve', 'Moderada', 'Crítica'].map((level) =>
            <button
              key={level}
              onClick={() => setObservation({ ...observation, severity: level })}
              style={{



                border: `1px solid ${observation.severity === level ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: observation.severity === level ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                color: observation.severity === level ? 'var(--color-primary)' : 'var(--color-text)',
                fontWeight: observation.severity === level ? 600 : 400

              }} className="flex-[1] p-[0.8rem] rounded-[8px] cursor-pointer">
              
                                {level}
                            </button>
            )}
                    </div>
                </div>

                <div className="mb-6">
                    <label className="flex items-center gap-[0.5rem]">
                        <User size={16} /> Responsable de Solución
                    </label>
                    <input
            list="responsables"
            placeholder="Nombre del responsable"
            value={observation.assignee}
            onChange={(e) => setObservation({ ...observation, assignee: e.target.value })} className="w-[100%] p-[0.8rem] rounded-[8px] border-[1px_solid_var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)]" />

          
                    <datalist id="responsables">
                        <option value="Jefe de Obra" />
                        <option value="Capataz" />
                        <option value="Responsable de Mantenimiento" />
                        <option value="Contratista General" />
                    </datalist>
                </div>

                <div className="mb-8">
                    <label className="flex items-center gap-[0.5rem]">
                        <Clock size={16} /> Plazo de Solución
                    </label>
                    <input
            list="plazos"
            value={observation.deadline}
            onChange={(e) => setObservation({ ...observation, deadline: e.target.value })} className="w-[100%] p-[0.8rem] rounded-[8px] border-[1px_solid_var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)]" />

          
                    <datalist id="plazos">
                        <option value="Inmediato" />
                        <option value="24 horas" />
                        <option value="48 horas" />
                        <option value="7 días" />
                        <option value="Próxima visita" />
                    </datalist>
                </div>

                <div className="flex gap-[1rem]">
                    <button
            className="btn-primary flex-[1] flex items-center justify-center gap-[0.5rem] p-[1rem]"
            onClick={(e) => {e.preventDefault();requirePro(handleSave);}}>

            
                        <Camera size={20} /> Tomar Foto
                    </button>
                    <button
            className="btn-outline flex-[1] flex items-center justify-center gap-[0.5rem] p-[1rem] border-[1px_solid_var(--color-primary)] text-[var(--color-primary)] bg-[transparent]"
            onClick={() => navigate('/risk', { state: { fromObservation: true, itemId: observation.itemId } })}>

            
                        <Shield size={20} /> Evaluar Riesgo
                    </button>
                </div>
            </div>
        </div>);

}