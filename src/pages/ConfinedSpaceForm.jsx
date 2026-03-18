import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Tent, ClipboardCheck } from 'lucide-react';

const SPACE_TYPES = [
    { id: 'tank', name: 'Tanque', icon: '🛢️' },
    { id: 'vessel', name: 'Recipiente', icon: '📦' },
    { id: 'silo', name: 'Silo', icon: '🏭' },
    { id: 'pit', name: 'Fosa', icon: '⬇️' },
    { id: 'tunnel', name: 'Túnel', icon: '🚇' },
    { id: 'sewer', name: 'Alcantarilla', icon: '🕳️' },
    { id: 'manhole', name: 'Boca de Visita', icon: '⭕' }
];

export default function ConfinedSpaceForm() {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);
    const [permit, setPermit] = useState({
        spaceName: '',
        spaceType: 'tank',
        location: '',
        worker: '',
        attendant: '',
        observations: '',
        hazards: [],
        ppe: []
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSave = () => {
        if (!permit.spaceName || !permit.worker || !permit.attendant) {
            alert('Por favor complete los campos obligatorios (*)');
            return;
        }

        const newEntry = {
            ...permit,
            id: `CS-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };

        const currentData = JSON.parse(localStorage.getItem('confined_space_permits') || '[]');
        localStorage.setItem('confined_space_permits', JSON.stringify([newEntry, ...currentData]));
        
        navigate('/confined-space');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '2rem' }}>
            <div style={{
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                padding: '1rem 1.5rem',
                position: 'sticky',
                top: 0,
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
                        <Tent size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Nuevo Permiso de Ingreso
                    </h1>
                </div>
                <button
                    onClick={handleSave}
                    className="btn-primary"
                    style={{ width: 'auto', margin: 0, padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Save size={18} />
                    {!isMobile && 'Emitir Permiso'}
                </button>
            </div>

            <main style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '2rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '1rem', background: 'var(--color-primary)10', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-primary)20' }}>
                        <ClipboardCheck size={24} color="var(--color-primary)" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)' }}>Cumplimiento OSHA 1910.146</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Nombre del Espacio Confinado *</label>
                            <input type="text" value={permit.spaceName} onChange={(e) => setPermit({ ...permit, spaceName: e.target.value })} style={inputStyle} placeholder="Ej: Tanque de Almacenamiento T-01" />
                        </div>
                        <div>
                            <label style={labelStyle}>Tipo de Espacio</label>
                            <select 
                                value={permit.spaceType} 
                                onChange={(e) => setPermit({ ...permit, spaceType: e.target.value })} 
                                style={inputStyle}
                            >
                                {SPACE_TYPES.map(t => (
                                    <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Ubicación / Planta</label>
                            <input type="text" value={permit.location} onChange={(e) => setPermit({ ...permit, location: e.target.value })} style={inputStyle} placeholder="Ej: Sector B - Almacenes" />
                        </div>
                        <div>
                            <label style={labelStyle}>Trabajador Autorizado *</label>
                            <input type="text" value={permit.worker} onChange={(e) => setPermit({ ...permit, worker: e.target.value })} style={inputStyle} placeholder="Nombre del ingresante" />
                        </div>
                        <div>
                            <label style={labelStyle}>Vigía de Seguridad (Attendant) *</label>
                            <input type="text" value={permit.attendant} onChange={(e) => setPermit({ ...permit, attendant: e.target.value })} style={inputStyle} placeholder="Nombre del vigía" />
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <label style={labelStyle}>Observaciones y Medidas Preventivas</label>
                        <textarea 
                            value={permit.observations} 
                            onChange={(e) => setPermit({ ...permit, observations: e.target.value })} 
                            style={{ ...inputStyle, minHeight: '120px', paddingTop: '0.75rem' }} 
                            placeholder="Describa riesgos específicos, niveles de gases detectados, etc..."
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
                        Emitir Permiso de Trabajo
                    </button>
                </div>
            </main>
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' };
const inputStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 500, outline: 'none', transition: 'all var(--transition-fast)', boxSizing: 'border-box' };
