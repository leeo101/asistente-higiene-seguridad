import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Lock, Save, Eye, CheckCircle2, Printer, Share2 } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import LOTOPdf from '../components/LOTOPdf';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';

const ENERGY_TYPES = [
    { id: 'electrical', name: 'Eléctrica', icon: '⚡', color: '#fbbf24' },
    { id: 'mechanical', name: 'Mecánica', icon: '🔧', color: '#6b7280' },
    { id: 'hydraulic', name: 'Hidráulica', icon: '💧', color: '#3b82f6' },
    { id: 'pneumatic', name: 'Neumática', icon: '💨', color: '#9ca3af' },
    { id: 'chemical', name: 'Química', icon: '🧪', color: '#10b981' },
    { id: 'thermal', name: 'Térmica', icon: '🔥', color: '#ef4444' }
];

const LOTO_DEVICES = [
    { id: 'padlock', name: 'Candado', icon: '🔒' },
    { id: 'hasp', name: 'Grampa Múltiple', icon: '📎' },
    { id: 'breaker_lock', name: 'Bloqueo Interruptor', icon: '⚡' },
    { id: 'valve_lock', name: 'Bloqueo Válvula', icon: '🔩' },
    { id: 'tagout', name: 'Etiqueta', icon: '🏷️' }
];

const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--color-text)'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-background)',
    color: 'var(--color-text)',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box' as any,
    transition: 'all 0.2s'
};

export default function LOTOForm(): React.ReactElement | null {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const { isPro, requirePro } = usePaywall();

    useDocumentTitle(isEdit ? 'Editar Procedimiento LOTO' : 'Nuevo Procedimiento LOTO');
    const [procedure, setProcedure] = useState({
        equipmentName: '',
        location: '',
        department: '',
        energyTypes: [],
        lotoDevices: [],
        supervisor: '',
        observations: '',
        isolationPoints: '',
        zeroEnergyVerification: {
            tested: false,
            method: 'try_start',
            result: 'safe'
        },
        signature: ''
    });

    useEffect(() => {
        if (location.state?.editData) {
            setProcedure(location.state.editData);
            setIsEdit(true);
        }
    }, [location.state]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleEnergy = (id) => {
        const updated = procedure.energyTypes.includes(id) 
            ? procedure.energyTypes.filter(e => e !== id) 
            : [...procedure.energyTypes, id];
        setProcedure({ ...procedure, energyTypes: updated });
    };

    const toggleDevice = (id) => {
        const updated = procedure.lotoDevices.includes(id) 
            ? procedure.lotoDevices.filter(d => d !== id) 
            : [...procedure.lotoDevices, id];
        setProcedure({ ...procedure, lotoDevices: updated });
    };

    const handleSave = () => {
        if (!procedure.equipmentName) {
            toast.error('Por favor complete el nombre del equipo');
            return;
        }

        const saved = JSON.parse(localStorage.getItem('loto_procedures_db') || '[]');
        let updated;

        if (isEdit) {
            updated = saved.map((p: any) => p.id === (procedure as any).id ? procedure : p);
            toast.success('Procedimiento actualizado');
        } else {
            const newEntry = {
                ...procedure,
                id: `LOTO-${Date.now()}`,
                createdAt: new Date().toISOString(),
                status: 'pending'
            };
            updated = [newEntry, ...saved];
            toast.success('Procedimiento guardado');
        }

        localStorage.setItem('loto_procedures_db', JSON.stringify(updated));
        navigate('/loto');
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
                        <Lock size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        {isEdit ? 'Editar Procedimiento LOTO' : 'Nuevo Procedimiento LOTO'}
                    </h1>
                </div>
                {/* Header Buttons Removed as they are now in the floating bar */}
            </div>

            <main style={{ padding: '3.5rem 1.5rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '2rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Nombre del Equipo *</label>
                            <input type="text" value={procedure.equipmentName} onChange={(e) => setProcedure({ ...procedure, equipmentName: e.target.value })} style={inputStyle} placeholder="Ej: Compresor Principal" />
                        </div>
                        <div>
                            <label style={labelStyle}>Ubicación</label>
                            <input type="text" value={procedure.location} onChange={(e) => setProcedure({ ...procedure, location: e.target.value })} style={inputStyle} placeholder="Ej: Sala de Máquinas" />
                        </div>
                        <div>
                            <label style={labelStyle}>Departamento</label>
                            <input type="text" value={procedure.department} onChange={(e) => setProcedure({ ...procedure, department: e.target.value })} style={inputStyle} placeholder="Ej: Mantenimiento" />
                        </div>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Supervisor / Responsable</label>
                            <input type="text" value={procedure.supervisor} onChange={(e) => setProcedure({ ...procedure, supervisor: e.target.value })} style={inputStyle} placeholder="Nombre completo" />
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Fuentes de Energía</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '1rem' }}>
                            {ENERGY_TYPES.map(type => (
                                <button 
                                    key={type.id} 
                                    onClick={() => toggleEnergy(type.id)} 
                                    style={{ 
                                        padding: '1rem', 
                                        background: procedure.energyTypes.includes(type.id) ? `${type.color}15` : 'var(--color-background)', 
                                        border: `2px solid ${procedure.energyTypes.includes(type.id) ? type.color : 'var(--color-border)'}`, 
                                        borderRadius: 'var(--radius-xl)', 
                                        cursor: 'pointer', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        gap: '0.5rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span style={{ fontSize: '2rem' }}>{type.icon}</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: procedure.energyTypes.includes(type.id) ? type.color : 'var(--color-text-muted)' }}>{type.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Dispositivos de Bloqueo</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '1rem' }}>
                            {LOTO_DEVICES.map(device => (
                                <button 
                                    key={device.id} 
                                    onClick={() => toggleDevice(device.id)} 
                                    style={{ 
                                        padding: '1rem', 
                                        background: procedure.lotoDevices.includes(device.id) ? 'var(--color-primary)' : 'var(--color-background)', 
                                        color: procedure.lotoDevices.includes(device.id) ? '#fff' : 'var(--color-text)', 
                                        border: `2px solid ${procedure.lotoDevices.includes(device.id) ? 'var(--color-primary)' : 'var(--color-border)'}`, 
                                        borderRadius: 'var(--radius-xl)', 
                                        cursor: 'pointer', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.5rem', 
                                        fontWeight: 700,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span style={{ fontSize: '1.5rem' }}>{device.icon}</span>
                                    <span style={{ fontSize: '0.8rem' }}>{device.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <label style={labelStyle}>Puntos de Aislamiento Específicos</label>
                        <input 
                            type="text" 
                            value={procedure.isolationPoints} 
                            onChange={(e) => setProcedure({ ...procedure, isolationPoints: e.target.value })} 
                            style={inputStyle} 
                            placeholder="Ej: Interruptor Principal Q1, Válvula Entrada Vapor V-01" 
                        />
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Verificación de Energía Cero</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem', background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    onClick={() => setProcedure({ ...procedure, zeroEnergyVerification: { ...procedure.zeroEnergyVerification, tested: !procedure.zeroEnergyVerification.tested } })}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        background: procedure.zeroEnergyVerification.tested ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-background)',
                                        border: `2px solid ${procedure.zeroEnergyVerification.tested ? 'var(--color-success)' : 'var(--color-border)'}`,
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        flex: 1
                                    }}
                                >
                                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '2px solid var(--color-success)', background: procedure.zeroEnergyVerification.tested ? 'var(--color-success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {procedure.zeroEnergyVerification.tested && <CheckCircle2 size={12} color="#fff" />}
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Energía Cero Verificada</span>
                                </button>
                            </div>
                            <div>
                                <label style={labelStyle}>Método de Verificación</label>
                                <select 
                                    value={procedure.zeroEnergyVerification.method} 
                                    onChange={(e) => setProcedure({ ...procedure, zeroEnergyVerification: { ...procedure.zeroEnergyVerification, method: e.target.value } })} 
                                    style={inputStyle}
                                >
                                    <option value="try_start">Intento de Arranque Local</option>
                                    <option value="tester">Medición con Instrumento (Tester)</option>
                                    <option value="gauge">Verificación de Manómetro</option>
                                    <option value="visual">Inspección Visual de Desconexión</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <label style={labelStyle}>Instrucciones Paso a Paso / Observaciones</label>
                        <textarea 
                            value={procedure.observations} 
                            onChange={(e) => setProcedure({ ...procedure, observations: e.target.value })} 
                            style={{ ...inputStyle, minHeight: '100px', paddingTop: '0.75rem' }} 
                            placeholder="1. Detener equipo... 2. Bloquear interruptor Q1... 3. Verificar energía cero..."
                        />
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <SignatureCanvas 
                            onSave={(sig) => setProcedure({ ...procedure, signature: sig || '' })}
                            initialImage={procedure.signature}
                            label="Firma del Responsable / Supervisor"
                        />
                    </div>
                </div>

            </main>

            <div className="no-print floating-action-bar">
                <button
                    onClick={() => requirePro(() => setShowShareModal(true))}
                    className="btn-floating-action"
                    style={{ background: '#0052CC', color: '#ffffff' }}
                >
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
                    onClick={() => requirePro(() => window.print())}
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
                    <Save size={18} /> GUARDAR PROCEDIMIENTO
                </button>
            </div>

            <ShareModal
                isOpen={showShareModal}
                open={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Procedimiento LOTO"
                text={`Bloqueo y Etiquetado: ${procedure.equipmentName}`}
                rawMessage={`Bloqueo y Etiquetado: ${procedure.equipmentName}`}
                fileName={`LOTO_${procedure.equipmentName || 'Sin_Nombre'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <LOTOPdf data={{ ...procedure, id: (procedure as any).id || Date.now().toString(), createdAt: (procedure as any).createdAt || new Date().toISOString() }} />
            </div>
        </div>
    );
}

