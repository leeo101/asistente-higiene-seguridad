import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, ArrowDown, Shield, AlertTriangle, Clock, CheckCircle2, User, MapPin, Ruler, Eye } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import WorkingAtHeightPdf from '../components/WorkingAtHeightPdf';

const WORK_TYPES = [
    { id: 'scaffolding', name: 'Andamios', icon: '🏗️' },
    { id: 'ladder', name: 'Escalera', icon: '🪜' },
    { id: 'roof', name: 'Techos', icon: '🏠' },
    { id: 'platform', name: 'Plataforma', icon: '📦' },
    { id: 'lift', name: 'Elevador', icon: '⬆️' },
    { id: 'structure', name: 'Estructura', icon: '🔩' }
];

const PRIORITY = {
    critical: { label: 'CRÍTICA', color: '#dc2626', icon: '🚨' },
    high: { label: 'ALTA', color: '#f59e0b', icon: '⚠️' },
    medium: { label: 'MEDIA', color: '#3b82f6', icon: 'ℹ️' },
    low: { label: 'BAJA', color: '#16a34a', icon: '✅' }
};

export default function WorkingAtHeightForm() {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [permit, setPermit] = useState({
        workerName: '',
        workType: 'scaffolding',
        location: '',
        height: '',
        priority: 'medium',
        supervisor: '',
        observations: '',
        medicalFitness: false,
        rescuePlan: '',
        equipmentCheck: {
            harness: 'good',
            lanyard: 'good',
            anchor: 'good'
        },
        ppe: {
            harness: true,
            lanyard: true,
            helmet: true,
            lifeline: false
        }
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSave = () => {
        if (!permit.workerName || !permit.height) {
            alert('Por favor complete los campos obligatorios (*)');
            return;
        }

        const newPermit = {
            ...permit,
            id: `WAH-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'open'
        };

        const currentData = JSON.parse(localStorage.getItem('working_at_height_permits') || '[]');
        localStorage.setItem('working_at_height_permits', JSON.stringify([newPermit, ...currentData]));
        
        navigate('/working-at-height-history');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '2rem' }}>
            <div style={{
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                padding: '1rem 1.5rem',
                position: 'sticky',
                top: '5.5rem',
                zIndex: 100,
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        padding: '0.5rem',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        color: 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 900 }}>
                        <ArrowDown size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Permiso de Trabajo en Altura
                    </h1>
                </div>
                <button
                    onClick={() => setShowShareModal(true)}
                    style={{
                        padding: '0.6rem 1rem',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-primary)',
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 700
                    }}
                >
                    <Eye size={18} />
                    {!isMobile && 'Vista Previa'}
                </button>
                <button
                    onClick={handleSave}
                    className="btn-primary"
                    style={{ width: 'auto', margin: 0, padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Save size={18} />
                    {!isMobile && 'Crear Permiso'}
                </button>
            </div>

            <main style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '2rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Nombre del Trabajador *</label>
                            <input type="text" value={permit.workerName} onChange={(e) => setPermit({ ...permit, workerName: e.target.value })} style={inputStyle} placeholder="Nombre completo" />
                        </div>
                        <div>
                            <label style={labelStyle}>Tipo de Trabajo</label>
                            <select value={permit.workType} onChange={(e) => setPermit({ ...permit, workType: e.target.value })} style={inputStyle}>
                                {WORK_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Alturaestimada (metros) *</label>
                            <div style={{ position: 'relative' }}>
                                <input type="number" step="0.1" value={permit.height} onChange={(e) => setPermit({ ...permit, height: e.target.value })} style={{ ...inputStyle, paddingRight: '2.5rem' }} placeholder="Ej: 3.5" />
                                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--color-text-muted)' }}>m</span>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Ubicación</label>
                            <input type="text" value={permit.location} onChange={(e) => setPermit({ ...permit, location: e.target.value })} style={inputStyle} placeholder="Ej: Sector B - Nivel 4" />
                        </div>
                        <div>
                            <label style={labelStyle}>Supervisor a Cargo</label>
                            <input type="text" value={permit.supervisor} onChange={(e) => setPermit({ ...permit, supervisor: e.target.value })} style={inputStyle} placeholder="Nombre del supervisor" />
                        </div>
                        <div>
                            <label style={labelStyle}>Prioridad / Riesgo</label>
                            <select value={permit.priority} onChange={(e) => setPermit({ ...permit, priority: e.target.value })} style={inputStyle}>
                                {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Validación Legal (Res. SRT 61/23)</h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <button
                                    onClick={() => setPermit({ ...permit, medicalFitness: !permit.medicalFitness })}
                                    style={{
                                        padding: '1rem',
                                        background: permit.medicalFitness ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-background)',
                                        border: `2px solid ${permit.medicalFitness ? 'var(--color-success)' : 'var(--color-border)'}`,
                                        borderRadius: 'var(--radius-lg)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem'
                                    }}
                                >
                                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: '2px solid var(--color-success)', background: permit.medicalFitness ? 'var(--color-success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {permit.medicalFitness && <CheckCircle2 size={14} color="#fff" />}
                                    </div>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Apto Médico Vigente</span>
                                </button>

                                <div>
                                    <label style={labelStyle}>Plan de Rescate (Resumen)</label>
                                    <textarea 
                                        value={permit.rescuePlan} 
                                        onChange={(e) => setPermit({ ...permit, rescuePlan: e.target.value })} 
                                        style={{ ...inputStyle, minHeight: '80px' }} 
                                        placeholder="Describa brevemente el método de rescate previsto..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Inspección de Equipos</h3>
                            {Object.entries(permit.equipmentCheck).map(([key, value]) => (
                                <div key={key} style={{ marginBottom: '1rem' }}>
                                    <label style={labelStyle}>{key === 'harness' ? 'Arnés' : key === 'lanyard' ? 'Cola de Amarre' : 'Punto de Anclaje'}</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {['good', 'bad', 'na'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => setPermit({ ...permit, equipmentCheck: { ...permit.equipmentCheck, [key]: status } })}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.5rem',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1px solid var(--color-border)',
                                                    background: value === status ? 'var(--color-primary)' : 'var(--color-surface)',
                                                    color: value === status ? 'white' : 'var(--color-text)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {status === 'good' ? 'B' : status === 'bad' ? 'M' : 'N/A'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Equipos de Protección Personal (EPP)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                            {Object.entries(permit.ppe).map(([key, value]) => (
                                <button
                                    key={key}
                                    onClick={() => setPermit({ ...permit, ppe: { ...permit.ppe, [key]: !value } })}
                                    style={{
                                        padding: '1rem',
                                        background: value ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-background)',
                                        border: `2px solid ${value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                        borderRadius: 'var(--radius-lg)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: '2px solid var(--color-primary)', background: value ? 'var(--color-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {value && <CheckCircle2 size={14} color="#fff" />}
                                    </div>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'capitalize' }}>
                                        {key === 'harness' && 'Arnés de Seguridad'}
                                        {key === 'lanyard' && 'Cola de Amarre'}
                                        {key === 'helmet' && 'Casco con Barbijo'}
                                        {key === 'lifeline' && 'Línea de Vida'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <label style={labelStyle}>Observaciones Adicionales</label>
                        <textarea 
                            value={permit.observations} 
                            onChange={(e) => setPermit({ ...permit, observations: e.target.value })} 
                            style={{ ...inputStyle, minHeight: '80px', paddingTop: '0.75rem' }} 
                            placeholder="Describa cualquier detalle relevante del trabajo o riesgos específicos..."
                        />
                    </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <button 
                        onClick={() => navigate(-1)} 
                        style={{ 
                            flex: 1, 
                            padding: '1rem', 
                            background: 'var(--color-surface)', 
                            border: '1px solid var(--color-border)', 
                            borderRadius: 'var(--radius-lg)', 
                            fontWeight: 700, 
                            cursor: 'pointer',
                            color: 'var(--color-text)'
                        }}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="btn-primary" 
                        style={{ flex: 2, margin: 0 }}
                    >
                        Emitir Permiso
                    </button>
                </div>
            </main>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Permiso Trabajo en Altura"
                fileName={`Altura_${permit.workerName || 'Sin_Nombre'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <WorkingAtHeightPdf data={{ ...permit, createdAt: permit.createdAt || new Date().toISOString() }} />
            </div>
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' };
const inputStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 500, outline: 'none', transition: 'all var(--transition-fast)', boxSizing: 'border-box' };
