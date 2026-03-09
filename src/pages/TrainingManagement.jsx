import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Users, Calendar, Clock, BookOpen,
    UserPlus, Trash2, CheckCircle2, FileText, Briefcase
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

export default function TrainingManagement() {
    useDocumentTitle('Gestión de Capacitaciones');
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();

    const [formData, setFormData] = useState({
        tema: '',
        expositor: currentUser?.displayName || '',
        fecha: new Date().toISOString().split('T')[0],
        duracion: '1',
        empresa: '',
        ubicacion: '',
        observaciones: '',
        asistentes: [
            { nombre: '', dni: '', puesto: '' }
        ]
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleArrayChange = (index, field, value) => {
        setFormData(prev => {
            const newAsistentes = [...prev.asistentes];
            newAsistentes[index] = { ...newAsistentes[index], [field]: value };
            return { ...prev, asistentes: newAsistentes };
        });
    };

    const addAsistente = () => {
        setFormData(prev => ({
            ...prev,
            asistentes: [...prev.asistentes, { nombre: '', dni: '', puesto: '' }]
        }));
    };

    const removeAsistente = (index) => {
        setFormData(prev => ({
            ...prev,
            asistentes: prev.asistentes.filter((_, i) => i !== index)
        }));
    };

    const handleSave = () => {
        if (!formData.tema || !formData.fecha) {
            toast.error('El tema y la fecha son obligatorios.');
            return;
        }

        // Filter out completely empty rows before saving
        const asistentesValidos = formData.asistentes.filter(a => a.nombre.trim() !== '' || a.dni.trim() !== '');

        if (asistentesValidos.length === 0) {
            toast.error('Debe ingresar al menos 1 asistente a la capacitación.');
            return;
        }

        const report = {
            id: Date.now(),
            date: new Date().toISOString(),
            ...formData,
            asistentes: asistentesValidos
        };

        const history = JSON.parse(localStorage.getItem('training_history') || '[]');
        history.unshift(report);
        localStorage.setItem('training_history', JSON.stringify(history));
        syncCollection('training_history', history);

        toast.success('Capacitación registrada correctamente.');
        navigate('/training-history');
    };

    return (
        <div className="container" style={{ paddingBottom: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Nueva Capacitación</h1>
                </div>
            </div>

            <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                    <BookOpen size={20} /> Metadatos de la Charla
                </h2>

                <div className="grid-2-cols">
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label>Tema / Título de la Capacitación</label>
                        <input
                            type="text"
                            placeholder="Ej. Inducción de Seguridad, Uso de EPP, Primeros Auxilios..."
                            value={formData.tema}
                            onChange={e => handleInputChange('tema', e.target.value)}
                            style={{ fontWeight: 'bold' }}
                        />
                    </div>
                    <div>
                        <label>Expositor / Instructor</label>
                        <input
                            type="text"
                            value={formData.expositor}
                            onChange={e => handleInputChange('expositor', e.target.value)}
                        />
                    </div>
                    <div>
                        <label>Sector / Lugar de Dictado</label>
                        <input
                            type="text"
                            placeholder="Ej. Sala de Reuniones 1"
                            value={formData.ubicacion}
                            onChange={e => handleInputChange('ubicacion', e.target.value)}
                        />
                    </div>
                    <div>
                        <label>Fecha</label>
                        <input
                            type="date"
                            value={formData.fecha}
                            onChange={e => handleInputChange('fecha', e.target.value)}
                        />
                    </div>
                    <div>
                        <label>Duración (Horas)</label>
                        <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={formData.duracion}
                            onChange={e => handleInputChange('duracion', e.target.value)}
                        />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label>Empresa / Contratista (Opcional)</label>
                        <input
                            type="text"
                            placeholder="Si aplica a una subcontratista específica"
                            value={formData.empresa}
                            onChange={e => handleInputChange('empresa', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="card" style={{ flex: 1, padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                        <Users size={20} /> Planilla de Asistentes
                    </h2>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '0.3rem 0.8rem', borderRadius: '20px' }}>
                        {formData.asistentes.length} cargados
                    </span>
                </div>

                <div className="hidden sm:grid" style={{ gridTemplateColumns: '2fr 1fr 1.5fr 40px', gap: '1rem', marginBottom: '0.5rem', padding: '0 0.5rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    <div>Apellido y Nombre</div>
                    <div>DNI / CUIL</div>
                    <div>Puesto / Sector</div>
                    <div></div>
                </div>

                {formData.asistentes.map((asistente, i) => (
                    <div key={i} style={{
                        display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 40px', gap: '1rem',
                        background: 'var(--color-surface)', padding: '0.8rem', borderRadius: '12px',
                        border: '1px solid var(--color-border)', marginBottom: '0.8rem', alignItems: 'center'
                    }} className="flex-col sm:grid">

                        <div className="w-full">
                            <label className="sm:hidden" style={{ fontSize: '0.75rem' }}>Nombre</label>
                            <input
                                type="text"
                                placeholder="Nombre completo"
                                value={asistente.nombre}
                                onChange={e => handleArrayChange(i, 'nombre', e.target.value)}
                                style={{ margin: 0, height: '44px' }}
                            />
                        </div>
                        <div className="w-full">
                            <label className="sm:hidden" style={{ fontSize: '0.75rem' }}>DNI</label>
                            <input
                                type="text"
                                placeholder="DNI..."
                                value={asistente.dni}
                                onChange={e => handleArrayChange(i, 'dni', e.target.value)}
                                style={{ margin: 0, height: '44px' }}
                            />
                        </div>
                        <div className="w-full">
                            <label className="sm:hidden" style={{ fontSize: '0.75rem' }}>Puesto</label>
                            <input
                                type="text"
                                placeholder="Ej. Soldador"
                                value={asistente.puesto}
                                onChange={e => handleArrayChange(i, 'puesto', e.target.value)}
                                style={{ margin: 0, height: '44px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => removeAsistente(i)}
                                disabled={formData.asistentes.length <= 1}
                                style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: 'rgba(239, 68, 68, 0.1)', border: 'none',
                                    color: formData.asistentes.length <= 1 ? 'var(--color-border)' : '#ef4444',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: formData.asistentes.length <= 1 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                <button
                    className="btn-outline"
                    onClick={addAsistente}
                    style={{
                        width: '100%', padding: '1rem', borderStyle: 'dashed',
                        borderWidth: '2px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '0.5rem', marginTop: '1rem'
                    }}
                >
                    <UserPlus size={18} /> Añadir Fila de Asistente
                </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                    className="btn-primary"
                    onClick={handleSave}
                    style={{ margin: 0, width: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    <Save size={20} /> Guardar Registro
                </button>
            </div>
        </div>
    );
}
