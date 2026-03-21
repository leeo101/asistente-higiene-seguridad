import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Save, Tent, ClipboardCheck, CheckCircle2,
    Eye, Printer, Share2, AlertTriangle, XCircle,
    User, Users, Shield, Wind, Droplets, Thermometer,
    Activity, ShieldCheck, AlertCircle, Plus, Trash2
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import ConfinedSpacePdf from '../components/ConfinedSpacePdf';

// Constants from ConfinedSpace.tsx
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

const ROLES = [
    { id: 'entrant', name: 'Entrante', icon: '👤', color: '#3b82f6' },
    { id: 'attendant', name: 'Vigía', icon: '👁️', color: '#f59e0b' },
    { id: 'supervisor', name: 'Supervisor', icon: '👔', color: '#16a34a' },
    { id: 'rescue', name: 'Rescate', icon: '🚑', color: '#dc2626' }
];

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

export default function ConfinedSpaceForm(): React.ReactElement | null {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    const [showShareModal, setShowShareModal] = useState(false);

    const [permit, setPermit] = useState({
        id: '',
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
        importance: 'high',
        status: 'pending',
        createdAt: new Date().toISOString(),
        observations: ''
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);

        if (location.state?.editData) {
            setPermit({
                ...location.state.editData,
                equipment: location.state.editData.equipment || EQUIPMENT_CHECKLIST.map(e => ({ ...e, checked: false })),
                hazards: location.state.editData.hazards || [],
                team: location.state.editData.team || { entrants: [], attendant: '', supervisor: '', rescue: '' }
            });
        }

        return () => window.removeEventListener('resize', handleResize);
    }, [location.state]);

    const toggleHazard = (hazardId: string) => {
        const updated = permit.hazards.includes(hazardId as never)
            ? permit.hazards.filter(h => h !== hazardId)
            : [...permit.hazards, hazardId];
        setPermit({ ...permit, hazards: updated as never[] });
    };

    const toggleEquipment = (equipId: string) => {
        const updated = permit.equipment.map(e =>
            e.id === equipId ? { ...e, checked: !e.checked } : e
        );
        setPermit({ ...permit, equipment: updated });
    };

    const addTeamMember = (role: string, name: string) => {
        if (role === 'entrant') {
            setPermit({
                ...permit,
                team: { ...permit.team, entrants: [...permit.team.entrants, name as never] }
            });
        } else {
            setPermit({
                ...permit,
                team: { ...permit.team, [role]: name }
            });
        }
    };

    const handleSave = () => {
        if (!permit.spaceName || !permit.location || !permit.team.attendant || !permit.team.supervisor) {
            alert('Por favor complete los campos obligatorios (*) incluyendo Vigía y Supervisor');
            return;
        }

        const newEntry = {
            ...permit,
            id: permit.id || `CS-${Date.now()}`,
            updatedAt: new Date().toISOString(),
            status: permit.status || 'pending'
        };

        const currentData = JSON.parse(localStorage.getItem('confined_space_permits_db') || '[]');
        const updatedData = permit.id
            ? currentData.map((item: any) => item.id === permit.id ? newEntry : item)
            : [newEntry, ...currentData];

        localStorage.setItem('confined_space_permits_db', JSON.stringify(updatedData));
        navigate('/confined-space-history');
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.8rem',
        fontWeight: 700,
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase' as const,
        marginBottom: '0.5rem'
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-input-border)',
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
        fontSize: '0.95rem',
        fontWeight: 500,
        outline: 'none',
        transition: 'all var(--transition-fast)',
        boxSizing: 'border-box' as const
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '2rem' }}>
            <div style={{
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                padding: '1rem 1.5rem',
                position: 'sticky',
                top: isMobile ? '0' : '5.5rem',
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
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 900 }}>
                        <Tent size={24} style={{ display: 'inline', marginRight: '0.75rem', verticalAlign: 'middle', color: '#f59e0b' }} />
                        Nuevo Permiso OSHA 1910.146
                    </h1>
                </div>
            </div>

            <main style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="card" style={{ padding: isMobile ? '1.5rem' : '2.5rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)' }}>

                    {/* Sección: Información General */}
                    <SectionTitle icon={<ClipboardCheck size={20} />} title="Información del Espacio" />
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
                            <label style={labelStyle}>Nombre del Espacio *</label>
                            <input type="text" value={permit.spaceName} onChange={(e) => setPermit({ ...permit, spaceName: e.target.value })} style={inputStyle} placeholder="Ej: Tanque de Almacenamiento T-101" />
                        </div>
                        <div>
                            <label style={labelStyle}>Tipo de Espacio</label>
                            <select value={permit.spaceType} onChange={(e) => setPermit({ ...permit, spaceType: e.target.value })} style={inputStyle}>
                                {CONFINED_SPACE_TYPES.map(t => (
                                    <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Ubicación / Planta *</label>
                            <input type="text" value={permit.location} onChange={(e) => setPermit({ ...permit, location: e.target.value })} style={inputStyle} placeholder="Ej: Planta Norte, Sector B" />
                        </div>
                        <div>
                            <label style={labelStyle}>Departamento</label>
                            <input type="text" value={permit.department} onChange={(e) => setPermit({ ...permit, department: e.target.value })} style={inputStyle} placeholder="Mantenimiento / Operaciones" />
                        </div>
                        <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
                            <label style={labelStyle}>Descripción del Trabajo</label>
                            <input type="text" value={permit.description} onChange={(e) => setPermit({ ...permit, description: e.target.value })} style={inputStyle} placeholder="Limpieza, soldadura, inspección..." />
                        </div>
                    </div>

                    {/* Sección: Peligros */}
                    <SectionTitle icon={<AlertTriangle size={20} />} title="Peligros Potenciales" />
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '2.5rem' }}>
                        {POTENTIAL_HAZARDS.map(hazard => (
                            <button
                                key={hazard.id}
                                onClick={() => toggleHazard(hazard.id)}
                                style={{
                                    padding: '0.75rem 0.5rem',
                                    background: permit.hazards.includes(hazard.id as never) ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-surface)',
                                    border: `2px solid ${permit.hazards.includes(hazard.id as never) ? '#ef4444' : 'var(--color-border)'}`,
                                    borderRadius: 'var(--radius-lg)',
                                    cursor: 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>{hazard.icon}</span>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, textAlign: 'center' }}>{hazard.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Sección: Equipamiento */}
                    <SectionTitle icon={<ShieldCheck size={20} />} title="Equipamiento Requerido" />
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '2.5rem' }}>
                        {permit.equipment.map(equip => (
                            <label key={equip.id} style={{
                                padding: '1rem',
                                background: equip.checked ? 'rgba(16, 163, 74, 0.1)' : 'var(--color-surface)',
                                border: `2px solid ${equip.checked ? '#16a34a' : 'var(--color-border)'}`,
                                borderRadius: 'var(--radius-lg)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '1rem'
                            }}>
                                <input type="checkbox" checked={equip.checked} onChange={() => toggleEquipment(equip.id)} style={{ width: '20px', height: '20px' }} />
                                <span style={{ fontSize: '1.2rem' }}>{equip.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{equip.name}</div>
                                    {equip.required && <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 800 }}>REQUERIDO</div>}
                                </div>
                            </label>
                        ))}
                    </div>

                    {/* Sección: Equipo de Trabajo */}
                    <SectionTitle icon={<Users size={20} />} title="Equipo de Trabajo" />
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div>
                            <label style={labelStyle}>Entrante(s) Autorizado(s)</label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <input id="entrant-input" type="text" placeholder="Nombre completo" style={inputStyle} onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = (e.target as HTMLInputElement).value.trim();
                                        if (val) { addTeamMember('entrant', val); (e.target as HTMLInputElement).value = ''; }
                                    }
                                }} />
                                <button onClick={() => {
                                    const input = document.getElementById('entrant-input') as HTMLInputElement;
                                    const val = input.value.trim();
                                    if (val) { addTeamMember('entrant', val); input.value = ''; }
                                }} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '0 1rem' }}><Plus size={20} /></button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {permit.team.entrants.map((entrant, idx) => (
                                    <span key={idx} style={{ padding: '0.4rem 0.85rem', background: '#eff6ff', border: '1px solid #3b82f6', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {entrant}
                                        <Trash2 size={14} style={{ cursor: 'pointer', color: '#ef4444' }} onClick={() => {
                                            const updated = permit.team.entrants.filter((_, i) => i !== idx);
                                            setPermit({ ...permit, team: { ...permit.team, entrants: updated } });
                                        }} />
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Vigía de Seguridad *</label>
                            <input type="text" value={permit.team.attendant} onChange={(e) => setPermit({ ...permit, team: { ...permit.team, attendant: e.target.value } })} style={inputStyle} placeholder="Nombre del vigía" />
                        </div>
                        <div>
                            <label style={labelStyle}>Supervisor de Entrada *</label>
                            <input type="text" value={permit.team.supervisor} onChange={(e) => setPermit({ ...permit, team: { ...permit.team, supervisor: e.target.value } })} style={inputStyle} placeholder="Nombre del supervisor" />
                        </div>
                        <div>
                            <label style={labelStyle}>Equipo de Rescate</label>
                            <input type="text" value={permit.team.rescue} onChange={(e) => setPermit({ ...permit, team: { ...permit.team, rescue: e.target.value } })} style={inputStyle} placeholder="Empresa o equipo interno" />
                        </div>
                    </div>

                    {/* Observaciones */}
                    <SectionTitle icon={<Activity size={20} />} title="Observaciones Finales" />
                    <textarea
                        value={permit.observations}
                        onChange={(e) => setPermit({ ...permit, observations: e.target.value })}
                        style={{ ...inputStyle, minHeight: '120px', paddingTop: '1rem' }}
                        placeholder="Detalles adicionales, medidas preventivas específicas, condiciones climáticas, etc."
                    />
                </div>
            </main>

            <div className="no-print floating-action-bar">
                <button onClick={() => navigate(-1)} className="btn-floating-action" style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                    CANCELAR
                </button>
                <button onClick={() => setShowShareModal(true)} className="btn-floating-action" style={{ background: '#0052CC', color: '#ffffff' }}>
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button onClick={handleSave} className="btn-floating-action" style={{ background: '#16a34a', color: '#ffffff' }}>
                    <Save size={18} /> GENERAR PERMISO
                </button>
            </div>

            <ShareModal
                isOpen={showShareModal}
                open={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Permiso de Ingreso"
                text={`Permiso de Espacio Confinado: ${permit.spaceName}`}
                rawMessage={`Permiso de Espacio Confinado: ${permit.spaceName}`}
                fileName={`Permiso_${permit.spaceName || 'Sin_Nombre'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <ConfinedSpacePdf data={{ ...permit, createdAt: permit.createdAt || new Date().toISOString() }} />
            </div>
        </div>
    );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode, title: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
        </div>
    );
}
