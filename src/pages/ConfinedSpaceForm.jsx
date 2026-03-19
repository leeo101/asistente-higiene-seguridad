import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Tent, ClipboardCheck, CheckCircle2, Eye, Printer, Share2 } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import ConfinedSpacePdf from '../components/ConfinedSpacePdf';

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
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [permit, setPermit] = useState({
        spaceName: '',
        spaceType: 'tank',
        location: '',
        worker: '',
        attendant: '',
        observations: '',
        gasMonitoring: {
            o2: '',
            lel: '',
            co: '',
            h2s: '',
            time: ''
        },
        ventilation: {
            forced: false,
            natural: true,
            exhaust: false
        },
        hazards: [],
        ppe: []
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        
        if (location.state?.editData) {
            setPermit(location.state.editData);
        }
        
        return () => window.removeEventListener('resize', handleResize);
    }, [location.state]);

    const handleSave = () => {
        if (!permit.spaceName || !permit.worker || !permit.attendant) {
            alert('Por favor complete los campos obligatorios (*)');
            return;
        }

        const newEntry = {
            ...permit,
            id: permit.id || `CS-${Date.now()}`,
            updatedAt: new Date().toISOString(),
            createdAt: permit.createdAt || new Date().toISOString(),
            status: permit.status || 'pending'
        };

        const currentData = JSON.parse(localStorage.getItem('confined_space_permits_db') || '[]');
        const updatedData = permit.id 
            ? currentData.map(item => item.id === permit.id ? newEntry : item)
            : [newEntry, ...currentData];
            
        localStorage.setItem('confined_space_permits_db', JSON.stringify(updatedData));
        navigate('/confined-space-history');
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
                        <Tent size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Nuevo Permiso de Ingreso
                    </h1>
                </div>
                {/* Header Buttons Removed as they are now in the floating bar */}
            </div>

            <main style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto', paddingTop: '1rem' }}>
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

                    <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Monitoreo Atmosférico (Res. SRT 95/20)</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Oxígeno (O2) %</label>
                                    <input type="number" step="0.1" value={permit.gasMonitoring.o2} onChange={(e) => setPermit({ ...permit, gasMonitoring: { ...permit.gasMonitoring, o2: e.target.value } })} style={inputStyle} placeholder="19.5 - 23.5" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Explosividad (LEL) %</label>
                                    <input type="number" step="1" value={permit.gasMonitoring.lel} onChange={(e) => setPermit({ ...permit, gasMonitoring: { ...permit.gasMonitoring, lel: e.target.value } })} style={inputStyle} placeholder="< 10%" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Monóxido (CO) ppm</label>
                                    <input type="number" step="1" value={permit.gasMonitoring.co} onChange={(e) => setPermit({ ...permit, gasMonitoring: { ...permit.gasMonitoring, co: e.target.value } })} style={inputStyle} placeholder="< 25 ppm" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Hora de Medición</label>
                                    <input type="time" value={permit.gasMonitoring.time} onChange={(e) => setPermit({ ...permit, gasMonitoring: { ...permit.gasMonitoring, time: e.target.value } })} style={inputStyle} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Ventilación</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {Object.entries(permit.ventilation).map(([key, value]) => (
                                    <button
                                        key={key}
                                        onClick={() => setPermit({ ...permit, ventilation: { ...permit.ventilation, [key]: !value } })}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            background: value ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-surface)',
                                            border: `2px solid ${value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '2px solid var(--color-primary)', background: value ? 'var(--color-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {value && <CheckCircle2 size={12} color="#fff" />}
                                        </div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                                            {key === 'forced' && 'Ventilación Forzada'}
                                            {key === 'natural' && 'Ventilación Natural'}
                                            {key === 'exhaust' && 'Extracción Localizada'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <label style={labelStyle}>Observaciones y Medidas de Seguridad</label>
                        <textarea 
                            value={permit.observations} 
                            onChange={(e) => setPermit({ ...permit, observations: e.target.value })} 
                            style={{ ...inputStyle, minHeight: '100px', paddingTop: '0.75rem' }} 
                            placeholder="Describa riesgos específicos, procedimiento de rescate, etc..."
                        />
                    </div>
                </div>

                {/* Botones de acción flotantes */}
                <div className="no-print" style={{
                    marginTop: '2rem',
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    padding: '1rem',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-lg)',
                    position: 'sticky',
                    bottom: '1rem',
                    zIndex: 100
                }}>
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="btn-floating-action"
                        style={{ background: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Share2 size={18} /> COMPARTIR
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="btn-floating-action"
                        style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Printer size={18} /> IMPRIMIR PDF
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn-floating-action"
                        style={{ background: '#36B37E', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Save size={18} /> GUARDAR PERMISO
                    </button>
                </div>
            </main>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Permiso de Ingreso"
                fileName={`Permiso_${permit.spaceName || 'Sin_Nombre'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <ConfinedSpacePdf data={{ ...permit, createdAt: permit.createdAt || new Date().toISOString() }} />
            </div>
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' };
const inputStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 500, outline: 'none', transition: 'all var(--transition-fast)', boxSizing: 'border-box' };
