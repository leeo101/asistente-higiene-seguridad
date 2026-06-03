import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
    ChevronRight, ChevronLeft,
    Save, Accessibility, AlertCircle, Info, Building2, Sparkles, Loader2
} from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';
import { auth } from '../firebase';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';

export default function ErgonomicsForm(): React.ReactElement | null {
    const navigate = useNavigate();
    const { syncCollection } = useSync();
    const location = useLocation();
    const editData = location.state?.editData;

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(editData || {
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
        const id = editData?.id || Date.now().toString();
        let history = JSON.parse(localStorage.getItem('ergonomics_history') || '[]');

        // Simulación de riesgo basado en Planilla 1
        let riesgo = 'Tolerable';
        const activeFactors = Object.values(formData.planilla1).filter(v => v === true).length;
        if (activeFactors > 2 || (formData.planilla1.levantamientoCarga && formData.calculoLevantamiento.peso > 25)) {
            riesgo = 'Moderado';
        }

        const report = { ...formData, id, riesgo };

        if (editData) {
            history = history.map(item => item.id === editData.id ? report : item);
        } else {
            history.unshift(report);
        }

        localStorage.setItem('ergonomics_history', JSON.stringify(history));
        syncCollection('ergonomics_history', history);
        
        toast.success(editData ? 'Estudio actualizado correctamente.' : 'Estudio registrado con éxito.');
        navigate(`/ergonomics-report?id=${id}`, { state: { report } });
    };

    const [isGeneratingConclusion, setIsGeneratingConclusion] = useState(false);

    const handleGenerateConclusion = async () => {
        setIsGeneratingConclusion(true);
        const loadingToast = toast.loading('Redactando recomendaciones técnicas...');
        try {
            const res = await fetch(`${API_BASE_URL}/api/ai-report-conclusion`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await auth.currentUser?.getIdToken(true)}`
                },
                body: JSON.stringify({
                    reportType: 'Estudio de Ergonomía Res 886/15',
                    reportData: {
                        empresa: formData.empresa,
                        sector: formData.sector,
                        puesto: formData.puesto,
                        descripcionTarea: formData.descripcionTarea,
                        factoresRiesgo: formData.planilla1,
                        datosLevantamientoCarga: formData.calculoLevantamiento
                    }
                })
            });
            if (!res.ok) throw new Error('Error al conectar con la IA');
            const data = await res.json();
            setFormData(prev => ({ ...prev, recomendaciones: data.conclusion }));
            toast.success('Recomendaciones generadas con éxito ✨', { id: loadingToast });
        } catch (error) {
            toast.error(`Error al generar: ${error.message}`, { id: loadingToast });
        } finally {
            setIsGeneratingConclusion(false);
        }
    };

    return (
        <div className="container print:pt-0 print:pb-0" style={{ paddingBottom: '8rem', maxWidth: '1000px' }}>
            <Breadcrumbs />

            <PremiumHeader
                title={editData ? 'Editar Estudio Ergonómico' : 'Nuevo Estudio Ergonómico'}
                subtitle="Protocolo Res. SRT 886/15"
                icon={<Accessibility size={36} />}
                onBack={() => navigate(-1)}
            />

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
                <div className="card animate-fade-in" style={{ padding: '2.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '24px', boxShadow: 'var(--shadow-lg)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-text)', borderBottom: '2px dashed var(--color-border)', paddingBottom: '1rem' }}>
                        <Building2 size={24} color="var(--color-primary)" /> Datos Generales
                    </h3>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Empresa / Establecimiento</label>
                        <input
                            className="input-professional"
                            value={formData.empresa}
                            onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                            placeholder="Nombre de la empresa"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Sector</label>
                            <input
                                className="input-professional"
                                value={formData.sector}
                                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                                placeholder="Logística, Planta, etc."
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Puesto de Trabajo</label>
                            <input
                                className="input-professional"
                                value={formData.puesto}
                                onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                                placeholder="Operario, Administrativo..."
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Descripción de la Tarea</label>
                        <textarea
                            className="input-professional"
                            rows={3}
                            value={formData.descripcionTarea}
                            onChange={(e) => setFormData({ ...formData, descripcionTarea: e.target.value })}
                            placeholder="Describa brevemente las acciones realizadas..."
                        />
                    </div>

                    <button className="btn-primary" onClick={handleNext} style={{ width: '100%', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem', background: '#36B37E', border: '1px solid #36B37E', color: 'white' }}>
                        Siguiente Paso <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="card animate-fade-in" style={{ padding: '2.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '24px', boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '2px dashed var(--color-border)', paddingBottom: '1rem' }}>
                        <AlertCircle size={24} color="#f97316" />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>Planilla 1: Identificación</h3>
                    </div>
                    <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginBottom: '2rem', fontWeight: 600 }}>
                        Indique la presencia de factores de riesgo en el puesto:
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                        {categories.map(cat => (
                            <label
                                key={cat.id}
                                className="hover:shadow-md transition-all"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '1.2rem', borderRadius: '16px', background: formData.planilla1[cat.id] ? 'rgba(54,179,126,0.08)' : 'var(--color-background)',
                                    border: `2px solid ${formData.planilla1[cat.id] ? '#36B37E' : 'var(--color-border)'}`,
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
                                    style={{ width: '22px', height: '22px', margin: 0, accentColor: '#36B37E' }}
                                />
                                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: formData.planilla1[cat.id] ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{cat.label}</span>
                            </label>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button className="btn-secondary" onClick={handleBack} style={{ flex: 1, minWidth: '120px', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 800 }}>
                            <ChevronLeft size={20} /> Atrás
                        </button>
                        <button className="btn-primary" onClick={handleNext} style={{ flex: 2, minWidth: '180px', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#36B37E', border: '1px solid #36B37E', color: 'white', fontWeight: 800 }}>
                            Siguiente Paso <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="card animate-fade-in" style={{ padding: '2.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '24px', boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '2px dashed var(--color-border)', paddingBottom: '1rem' }}>
                        <Accessibility size={24} color="var(--color-primary)" />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>Planilla 2.A: Evaluación</h3>
                    </div>

                    {formData.planilla1.levantamientoCarga ? (
                        <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', padding: '1.8rem', borderRadius: '16px', marginBottom: '2.5rem' }}>
                            <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>Levantamiento de Cargas</h4>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Peso Efectivo (kg)</label>
                                    <input
                                        className="input-professional"
                                        type="number"
                                        value={formData.calculoLevantamiento.peso}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            calculoLevantamiento: { ...formData.calculoLevantamiento, peso: Number(e.target.value) }
                                        })}
                                        placeholder="Ej: 15"
                                    />
                                    {formData.calculoLevantamiento.peso > 25 && (
                                        <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <AlertCircle size={12} /> Excede el límite legal de 25 kg
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Distancia Horizontal (Cuerpo-Carga)</label>
                                    <select
                                        className="input-professional"
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
                            </div>

                            <div style={{ marginBottom: '0.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Altura de Agarre</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.8rem' }}>
                                    {['Suelo', 'Rodilla', 'Cintura', 'Hombro'].map(h => (
                                        <button
                                            key={h}
                                            onClick={() => setFormData({
                                                ...formData,
                                                calculoLevantamiento: { ...formData.calculoLevantamiento, altura: h.toLowerCase() }
                                            })}
                                            className="transition-all"
                                            style={{
                                                padding: '0.8rem',
                                                fontSize: '0.9rem',
                                                borderRadius: '12px',
                                                border: `2px solid ${formData.calculoLevantamiento.altura === h.toLowerCase() ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                                background: formData.calculoLevantamiento.altura === h.toLowerCase() ? 'var(--color-primary)' : 'var(--color-surface)',
                                                color: formData.calculoLevantamiento.altura === h.toLowerCase() ? 'white' : 'var(--color-text)',
                                                fontWeight: 800,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {h}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed var(--color-border)', background: 'var(--color-background)', borderRadius: '16px', marginBottom: '2.5rem' }}>
                            <Info size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: 'var(--color-text)' }}>Evaluación no requerida</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                No se identificaron riesgos que requieran evaluación detallada.
                            </p>
                        </div>
                    )}

                    <div style={{ marginBottom: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <label style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>Recomendaciones de Acción</label>
                            <button
                                className="no-print"
                                onClick={handleGenerateConclusion}
                                disabled={isGeneratingConclusion}
                                style={{ padding: '0.6rem 1.2rem', background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem', cursor: isGeneratingConclusion ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(236,72,153,0.3)' }}
                            >
                                {isGeneratingConclusion ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                {isGeneratingConclusion ? 'REDACTANDO...' : 'REDACTAR CON IA'}
                            </button>
                        </div>
                        <textarea
                            rows={4}
                            className="input-professional block w-full no-print"
                            value={formData.recomendaciones}
                            onInput={(e: any) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            onChange={(e) => setFormData({ ...formData, recomendaciones: e.target.value })}
                            placeholder="Proponga medidas correctivas o ingenieriles..."
                        />
                        <div className="print-only whitespace-pre-wrap break-words mt-2 font-semibold">
                            {formData.recomendaciones || 'Sin recomendaciones especificadas.'}
                        </div>
                    </div>

                    <div className="no-print" style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleBack}
                            style={{ flex: 1, minWidth: '120px', padding: '1rem', background: 'transparent', color: 'var(--color-text)', border: '2px solid var(--color-border)', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                        >
                            <ChevronLeft size={20} /> ATRÁS
                        </button>
                        <button
                            onClick={handleSave}
                            style={{ flex: 2, minWidth: '200px', padding: '1rem', background: '#36B37E', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(54,179,126,0.3)' }}
                        >
                            <Save size={20} /> GUARDAR ESTUDIO
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
