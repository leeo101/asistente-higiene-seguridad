import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Tent, ArrowLeft, Save, Printer, Share2, 
    Wind, Droplets, Thermometer, Activity,
    Shield, AlertTriangle, User, Users, Calendar,
    CheckCircle2, XCircle
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import ConfinedSpacePdf from '../components/ConfinedSpacePdf';

// Tipos de espacios confinados
const CONFINED_SPACE_TYPES = [
    { id: 'tank', name: 'Tanque', icon: '🛢️' },
    { id: 'vessel', name: 'Recipiente', icon: '📦' },
    { id: 'silo', name: 'Silo', icon: '🏭' },
    { id: 'pit', name: 'Fosa', icon: '⬇️' },
    { id: 'tunnel', name: 'Túnel', icon: '🚇' },
    { id: 'sewer', name: 'Alcantarilla', icon: '🕳️' },
    { id: 'manhole', name: 'Boca de Visita', icon: '⭕' },
    { id: 'other', name: 'Otro', icon: '📍' }
];

// Equipamiento requerido
const EQUIPMENT_CHECKLIST = [
    { id: 'gas_detector', name: 'Detector de Gases', icon: '💨', required: true },
    { id: 'harness', name: 'Arnés de Seguridad', icon: '🦺', required: true },
    { id: 'tripod', name: 'Trípode con Malacate', icon: '🏗️', required: true },
    { id: 'ventilator', name: 'Ventilador', icon: '💨', required: false },
    { id: 'radio', name: 'Radio Comunicación', icon: '📻', required: true },
    { id: 'light', name: 'Iluminación', icon: '💡', required: true },
    { id: 'scba', name: 'ERA (SCBA)', icon: '😷', required: false },
    { id: 'first_aid', name: 'Botiquín Primeros Auxilios', icon: '🏥', required: true },
    { id: 'fire_extinguisher', name: 'Extintor', icon: '🧯', required: true },
    { id: 'barrier', name: 'Barreras/Señalización', icon: '🚧', required: true }
];

// Peligros potenciales
const POTENTIAL_HAZARDS = [
    { id: 'atmospheric', name: 'Atmosférico Peligroso', icon: '💨' },
    { id: 'engulfment', name: 'Atrapamiento', icon: '🌊' },
    { id: 'configuration', name: 'Configuración', icon: '📐' },
    { id: 'electrical', name: 'Eléctrico', icon: '⚡' },
    { id: 'mechanical', name: 'Mecánico', icon: '🔧' },
    { id: 'thermal', name: 'Térmico', icon: '🔥' },
    { id: 'noise', name: 'Ruido', icon: '🔊' },
    { id: 'fall', name: 'Caída', icon: '⬇️' },
    { id: 'chemical', name: 'Químico', icon: '🧪' },
    { id: 'biological', name: 'Biológico', icon: '🦠' }
];

export default function ConfinedSpaceForm() {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [permit, setPermit] = useState(() => ({
        spaceName: '',
        spaceType: 'tank',
        location: '',
        department: '',
        description: '',
        hazards: [],
        team: {
            entrants: [],
            attendant: '',
            supervisor: '',
            rescue: ''
        },
        equipment: EQUIPMENT_CHECKLIST.map(e => ({ ...e, checked: false })),
        atmosphericReadings: [],
        validFrom: new Date().toISOString().slice(0, 16),
        validUntil: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16),
        observations: ''
    }));

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSave = () => {
        if (!permit.spaceName.trim() || !permit.location.trim()) {
            alert('Por favor complete los campos obligatorios (*) Solo nombre del espacio y ubicación');
            return;
        }

        const newEntry = {
            ...permit,
            id: `CS-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };

        const currentData = JSON.parse(localStorage.getItem('confined_space_permits_db') || '[]');
        localStorage.setItem('confined_space_permits_db', JSON.stringify([newEntry, ...currentData]));
        
        navigate('/confined-space-history'); // Assuming history view for manager
        // Or navigate back to manager
        // navigate('/confined-space');
    };

    const toggleHazard = (id) => {
        setPermit(prev => ({
            ...prev,
            hazards: prev.hazards.includes(id) 
                ? prev.hazards.filter(h => h !== id)
                : [...prev.hazards, id]
        }));
    };

    const toggleEquipment = (id) => {
        setPermit(prev => ({
            ...prev,
            equipment: prev.equipment.map(e => 
                e.id === id ? { ...e, checked: !e.checked } : e
            )
        }));
    };

    const addEntrant = (name) => {
        if (!name.trim()) return;
        setPermit(prev => ({
            ...prev,
            team: {
                ...prev.team,
                entrants: [...prev.team.entrants, name.trim()]
            }
        }));
    };

    const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' };
    const inputStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 500, outline: 'none', boxSizing: 'border-box' };

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
                        <Tent size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Nuevo Permiso Confined Space
                    </h1>
                </div>
            </div>

            <main style={{ padding: '3.5rem 1.5rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '2rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)' }}>
                    {/* Basic Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Nombre del Espacio *</label>
                            <input type="text" value={permit.spaceName} onChange={(e) => setPermit({ ...permit, spaceName: e.target.value })} style={inputStyle} placeholder="Ej: Tanque de Combustible T-01" />
                        </div>
                        <div>
                            <label style={labelStyle}>Tipo de Espacio</label>
                            <select value={permit.spaceType} onChange={(e) => setPermit({ ...permit, spaceType: e.target.value })} style={inputStyle}>
                                {CONFINED_SPACE_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Ubicación *</label>
                            <input type="text" value={permit.location} onChange={(e) => setPermit({ ...permit, location: e.target.value })} style={inputStyle} placeholder="Sector / Planta" />
                        </div>
                        <div>
                            <label style={labelStyle}>Válido Desde</label>
                            <input type="datetime-local" value={permit.validFrom} onChange={(e) => setPermit({ ...permit, validFrom: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Válido Hasta</label>
                            <input type="datetime-local" value={permit.validUntil} onChange={(e) => setPermit({ ...permit, validUntil: e.target.value })} style={inputStyle} />
                        </div>
                    </div>

                    {/* Hazards */}
                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Peligros Potenciales</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '0.75rem' }}>
                            {POTENTIAL_HAZARDS.map(hazard => (
                                <button
                                    key={hazard.id}
                                    onClick={() => toggleHazard(hazard.id)}
                                    style={{
                                        padding: '0.75rem',
                                        background: permit.hazards.includes(hazard.id) ? 'rgba(220, 38, 38, 0.1)' : 'var(--color-surface)',
                                        border: `1px solid ${permit.hazards.includes(hazard.id) ? '#dc2626' : 'var(--color-border)'}`,
                                        borderRadius: 'var(--radius-lg)',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: permit.hazards.includes(hazard.id) ? '#dc2626' : 'var(--color-text)'
                                    }}
                                >
                                    <span>{hazard.icon}</span>
                                    <span style={{ fontWeight: 600 }}>{hazard.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Equipment Checklist */}
                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Equipamiento de Seguridad</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                            {permit.equipment.map(equip => (
                                <button
                                    key={equip.id}
                                    onClick={() => toggleEquipment(equip.id)}
                                    style={{
                                        padding: '0.75rem',
                                        background: equip.checked ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-surface)',
                                        border: `1px solid ${equip.checked ? '#16a34a' : 'var(--color-border)'}`,
                                        borderRadius: 'var(--radius-lg)',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: equip.checked ? '#16a34a' : 'var(--color-text)'
                                    }}
                                >
                                    <div style={{ width: '18px', height: '18px', border: '2px solid #16a34a', borderRadius: '4px', background: equip.checked ? '#16a34a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {equip.checked && <CheckCircle2 size={12} color="#fff" />}
                                    </div>
                                    <span>{equip.icon}</span>
                                    <span style={{ fontWeight: 600 }}>{equip.name}</span>
                                    {equip.required && <span style={{ color: '#dc2626' }}>*</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Team */}
                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Equipo de Trabajo</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={labelStyle}>Entrantes</label>
                                <input
                                    type="text"
                                    placeholder="Presione Enter para agregar"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') { addEntrant(e.target.value); e.target.value = ''; }
                                    }}
                                    style={inputStyle}
                                />
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                                    {permit.team.entrants.map((name, idx) => (
                                        <span key={idx} style={{ padding: '0.35rem 0.65rem', background: '#3b82f6', color: '#fff', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            {name}
                                            <XCircle size={14} onClick={() => setPermit(p => ({ ...p, team: { ...p.team, entrants: p.team.entrants.filter((_, i) => i !== idx) } }))} style={{ cursor: 'pointer' }} />
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Vigía (Attendant)</label>
                                <input type="text" value={permit.team.attendant} onChange={(e) => setPermit({ ...permit, team: { ...permit.team, attendant: e.target.value } })} style={inputStyle} placeholder="Nombre del vigía" />
                            </div>
                            <div>
                                <label style={labelStyle}>Supervisor</label>
                                <input type="text" value={permit.team.supervisor} onChange={(e) => setPermit({ ...permit, team: { ...permit.team, supervisor: e.target.value } })} style={inputStyle} placeholder="Nombre del supervisor" />
                            </div>
                            <div>
                                <label style={labelStyle}>Equipo de Rescate</label>
                                <input type="text" value={permit.team.rescue} onChange={(e) => setPermit({ ...permit, team: { ...permit.team, rescue: e.target.value } })} style={inputStyle} placeholder="Empresa o equipo" />
                            </div>
                        </div>
                    </div>

                    {/* Observations */}
                    <div style={{ marginTop: '2.5rem' }}>
                        <label style={labelStyle}>Observaciones / Notas Adicionales</label>
                        <textarea 
                            value={permit.observations} 
                            onChange={(e) => setPermit({ ...permit, observations: e.target.value })} 
                            style={{ ...inputStyle, minHeight: '100px', paddingTop: '0.75rem' }} 
                            placeholder="Describa detalle del trabajo, métodos de comunicación o rescate..."
                        />
                    </div>
                </div>
            </main>

            <div className="no-print floating-action-bar">
                <button
                    onClick={() => setShowShareModal(true)}
                    className="btn-floating-action"
                    style={{ background: '#0052CC', color: '#ffffff' }}
                >
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
                    onClick={() => window.print()}
                    className="btn-floating-action"
                    style={{ background: '#FF8B00', color: '#ffffff' }}
                >
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
                <button
                    onClick={handleSave}
                    className="btn-floating-action"
                    style={{ background: '#36B37E', color: '#ffffff' }}
                >
                    <Save size={18} /> GUARDAR PERMISO
                </button>
            </div>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Permiso Espacio Confinado"
                fileName={`ConfinedSpace_${permit.spaceName || 'Sin_Nombre'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <ConfinedSpacePdf data={{ ...permit, createdAt: new Date().toISOString() }} />
            </div>
        </div>
    );
}
