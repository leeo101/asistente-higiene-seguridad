import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ChevronRight, ChevronLeft,
    Save, Accessibility, AlertCircle, Info, User, Building2
} from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';

export default function ErgonomicsForm() {
    const navigate = useNavigate();
    const { syncCollection } = useSync();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        empresa: '',
        cuit: '',
        sector: '',
        puesto: '',
        descripcionTarea: '',
        planilla1: {
            esfuerzoManual: false,
            levantamientoCarga: false,
            posturasForzadas: false,
            movimientosRepetitivos: false,
            empujeArrastre: false,
            vibraciones: false,
            confortTermico: false,
            bipedestación: false
        },
        calculoLevantamiento: {
            peso: 0,
            asimetria: '0', // 0, 30, 45, 60, 90
            frecuencia: 'baja', // baja, media, alta
            distanciaH: 'cerca', // cerca (<25cm), media (25-50cm), lejos (>50cm)
            altura: 'cintura' // suelo, rodilla, cintura, hombro
        },
        recomendaciones: ''
    });

    const categories = [
        { id: 'esfuerzoManual', label: 'Esfuerzo Manual Intenso' },
        { id: 'levantamientoCarga', label: 'Levantamiento/Descenso de Cargas' },
        { id: 'posturasForzadas', label: 'Posturas Forzadas' },
        { id: 'movimientosRepetitivos', label: 'Movimientos Repetitivos' },
        { id: 'empujeArrastre', label: 'Empuje y Arrastre' },
        { id: 'vibraciones', label: 'Vibraciones Cuerpo/Mano' },
        { id: 'confortTermico', label: 'Confort Térmico' }
    ];

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleSave = () => {
        const id = Date.now().toString();
        const history = JSON.parse(localStorage.getItem('ergonomics_history') || '[]');

        // Simulación de riesgo basado en Planilla 1
        let riesgo = 'Tolerable';
        const activeFactors = Object.values(formData.planilla1).filter(v => v === true).length;
        if (activeFactors > 2 || formData.calculoLevantamiento.peso > 25) {
            riesgo = 'Moderado';
        }

        const newEntry = { ...formData, id, riesgo };
        history.push(newEntry);
        localStorage.setItem('ergonomics_history', JSON.stringify(history));
        syncCollection('ergonomics_history', history);
        navigate(`/ergonomics-report?id=${id}`);
    };

    return (
        <div className="container" style={{ paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', marginTop: '1rem' }}>
                <button
                    onClick={() => navigate('/ergonomics')}
                    style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}
                >
                    <ArrowLeft />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Nuevo Estudio Ergonómico</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Protocolo Res. SRT 886/15</p>
                </div>
            </div>

            {/* Stepper Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '15px', left: '0', width: '100%', height: '2px', background: 'var(--color-border)', zIndex: 0 }}></div>
                {[1, 2, 3].map(s => (
                    <div key={s} style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: step >= s ? 'var(--color-primary)' : 'var(--color-surface)',
                        border: '2px solid var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: step >= s ? 'white' : 'var(--color-primary)',
                        fontWeight: 700, fontSize: '0.85rem', zIndex: 1
                    }}>
                        {s}
                    </div>
                ))}
            </div>

            {step === 1 && (
                <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={20} color="var(--color-primary)" /> Datos Generales
                    </h3>

                    <div style={{ marginBottom: '1.2rem' }}>
                        <label>Empresa / Establecimiento</label>
                        <input
                            value={formData.empresa}
                            onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                            placeholder="Nombre de la empresa"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                        <div>
                            <label>Sector</label>
                            <input
                                value={formData.sector}
                                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                                placeholder="Logística, Planta, etc."
                            />
                        </div>
                        <div>
                            <label>Puesto de Trabajo</label>
                            <input
                                value={formData.puesto}
                                onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                                placeholder="Operario, Administrativo..."
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label>Descripción de la Tarea</label>
                        <textarea
                            rows={3}
                            value={formData.descripcionTarea}
                            onChange={(e) => setFormData({ ...formData, descripcionTarea: e.target.value })}
                            placeholder="Describa brevemente las acciones realizadas..."
                        />
                    </div>

                    <button className="btn-primary" onClick={handleNext} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        Siguiente <ChevronRight size={18} />
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="card">
                    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={20} color="#f97316" />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Planilla 1: Identificación</h3>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                        Indique la presencia de factores de riesgo en el puesto:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2rem' }}>
                        {categories.map(cat => (
                            <label
                                key={cat.id}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '1rem', borderRadius: '12px', background: 'var(--color-background)',
                                    border: `1px solid ${formData.planilla1[cat.id] ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    cursor: 'pointer'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={formData.planilla1[cat.id]}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        planilla1: { ...formData.planilla1, [cat.id]: e.target.checked }
                                    })}
                                    style={{ width: '20px', height: '20px', margin: 0 }}
                                />
                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{cat.label}</span>
                            </label>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn-secondary" onClick={handleBack} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <ChevronLeft size={18} /> Atrás
                        </button>
                        <button className="btn-primary" onClick={handleNext} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            Siguiente <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="card">
                    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Accessibility size={20} color="var(--color-primary)" />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Planilla 2.A: Evaluación</h3>
                    </div>

                    {formData.planilla1.levantamientoCarga ? (
                        <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '1.2rem', borderRadius: '12px', marginBottom: '2rem' }}>
                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700 }}>Levantamiento de Cargas</h4>

                            <div style={{ marginBottom: '1.2rem' }}>
                                <label>Peso Efectivo (kg)</label>
                                <input
                                    type="number"
                                    value={formData.calculoLevantamiento.peso}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        calculoLevantamiento: { ...formData.calculoLevantamiento, peso: e.target.value }
                                    })}
                                    placeholder="Ej: 15"
                                />
                                {formData.calculoLevantamiento.peso > 25 && (
                                    <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.3rem', fontWeight: 600 }}>
                                        Excede el límite legal de 25 kg (Nivel 2 de Riesgo)
                                    </p>
                                )}
                            </div>

                            <div style={{ marginBottom: '1.2rem' }}>
                                <label>Distancia Horizontal (Cuerpo-Carga)</label>
                                <select
                                    value={formData.calculoLevantamiento.distanciaH}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        calculoLevantamiento: { ...formData.calculoLevantamiento, distanciaH: e.target.value }
                                    })}
                                >
                                    <option value="cerca">Cerca (menos de 25 cm)</option>
                                    <option value="media">Media (25 a 50 cm)</option>
                                    <option value="lejos">Lejos (más de 50 cm)</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '0.5rem' }}>
                                <label>Altura de Agarre</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                    {['Suelo', 'Rodilla', 'Cintura', 'Hombro'].map(h => (
                                        <button
                                            key={h}
                                            onClick={() => setFormData({
                                                ...formData,
                                                calculoLevantamiento: { ...formData.calculoLevantamiento, altura: h.toLowerCase() }
                                            })}
                                            style={{
                                                padding: '0.6rem',
                                                fontSize: '0.8rem',
                                                borderRadius: '8px',
                                                border: `1px solid ${formData.calculoLevantamiento.altura === h.toLowerCase() ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                                background: formData.calculoLevantamiento.altura === h.toLowerCase() ? 'var(--color-primary)' : 'transparent',
                                                color: formData.calculoLevantamiento.altura === h.toLowerCase() ? 'white' : 'var(--color-text)',
                                                fontWeight: 600
                                            }}
                                        >
                                            {h}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5, background: 'var(--color-background)', borderRadius: '12px', marginBottom: '2rem' }}>
                            <Info size={32} style={{ marginBottom: '0.5rem' }} />
                            <p style={{ margin: 0, fontSize: '0.85rem' }}>
                                No se identificaron riesgos que requieran evaluación detallada.
                            </p>
                        </div>
                    )}

                    <div style={{ marginBottom: '2rem' }}>
                        <label>Recomendaciones de Acción</label>
                        <textarea
                            rows={3}
                            value={formData.recomendaciones}
                            onChange={(e) => setFormData({ ...formData, recomendaciones: e.target.value })}
                            placeholder="Proponga medidas correctivas o ingenieriles..."
                        />
                    </div>

                    {/* Botones de acción estables (no fijos) para evitar saltos en móvil */}
                    <div className="no-print" style={{
                        marginTop: '2rem',
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            className="btn-floating-action"
                            onClick={handleBack}
                            style={{ background: 'white', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                        >
                            <ChevronLeft size={18} /> ATRÁS
                        </button>
                        <button
                            onClick={handleSave}
                            className="btn-floating-action"
                            style={{ background: '#36B37E', color: 'white' }}
                        >
                            <Save size={18} /> GUARDAR ESTUDIO
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
