import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Lock, Save, Eye, CheckCircle2, Printer, Share2, Pencil } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import LOTOPdf from '../components/LOTOPdf';
import PdfSignatures from '../components/PdfSignatures';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PremiumHeader from '../components/PremiumHeader';

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
  const { requirePro } = usePaywall();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
  const { isPro } = usePaywall();

    useDocumentTitle(isEdit ? 'Editar Procedimiento LOTO' : 'Nuevo Procedimiento LOTO');
    const [procedure, setProcedure] = useState<any>({
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
        signature: '',
        operatorSignature: '',
        supervisorSignature: '',
        showSignatures: { operator: true, professional: true, supervisor: true }
    });

    const [professional, setProfessional] = useState<any>({
        name: '',
        license: '',
        signature: null,
        stamp: null
    });

    const setShowSignatures = (updater: any) => {
        setProcedure((prev: any) => {
            const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
            return { ...prev, showSignatures: updated };
        });
    };

    const showSignatures = procedure.showSignatures || { operator: true, professional: true, supervisor: true };

    useEffect(() => {
        if (location.state?.editData) {
            const ed = location.state.editData;
            setProcedure({
                ...ed,
                operatorSignature: ed.operatorSignature || '',
                supervisorSignature: ed.supervisorSignature || ed.signature || '',
                signature: ed.signature || ed.supervisorSignature || '',
                showSignatures: ed.showSignatures || { operator: true, professional: true, supervisor: true }
            });
            setIsEdit(true);
        }
    }, [location.state]);

    useEffect(() => {
        window.scrollTo(0, 0);
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);

        const savedData = localStorage.getItem('personalData');
        const savedSigData = localStorage.getItem('signatureStampData');
        const legacySignature = localStorage.getItem('capturedSignature');

        let signature = legacySignature || null;
        let stamp = null;
        if (savedSigData) {
            const parsed = JSON.parse(savedSigData);
            signature = parsed.signature || signature;
            stamp = parsed.stamp || null;
        }

        if (savedData) {
            const data = JSON.parse(savedData);
            setProfessional({
                name: data.name || '',
                license: data.license || '',
                signature: signature,
                stamp: stamp
            });
        } else {
            setProfessional((prev: any) => ({ ...prev, signature, stamp }));
        }

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

        const newEntry = {
            ...procedure,
            id: `LOTO-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'pending',
            professionalSignature: procedure.professionalSignature || professional.signature,
            professionalName: procedure.professionalName || professional.name,
            professionalLicense: procedure.professionalLicense || professional.license,
            professionalStamp: procedure.professionalStamp || professional.stamp,
        };
        
        if (isEdit) {
            const entryToSave = {
                ...procedure,
                professionalSignature: procedure.professionalSignature || professional.signature,
                professionalName: procedure.professionalName || professional.name,
                professionalLicense: procedure.professionalLicense || professional.license,
                professionalStamp: procedure.professionalStamp || professional.stamp,
            };
            updated = saved.map((p: any) => p.id === (procedure as any).id ? entryToSave : p);
            toast.success('Procedimiento actualizado');
        } else {
            updated = [newEntry, ...saved];
            toast.success('Procedimiento guardado');
        }

        localStorage.setItem('loto_procedures_db', JSON.stringify(updated));
        navigate('/loto');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '2rem' }}>
            <PremiumHeader 
                title={isEdit ? 'Editar LOTO' : 'Nuevo LOTO'}
                subtitle="Procedimiento de Bloqueo y Etiquetado"
                icon={<Lock size={32} color="#ffffff" />}
                color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
            />

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', marginTop: '1.5rem', padding: '0 1.5rem', maxWidth: '800px', margin: '1.5rem auto 0' }}>
                <button
                    onClick={() => navigate('/loto')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #36B37E 0%, #2A9365 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 15px rgba(54, 179, 126, 0.3)'
                    }}
                >
                    <ArrowLeft size={18} />
                    VOLVER
                </button>
            </div>

            <main style={{ padding: '3.5rem 1.5rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '2rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(37,99,235,0.3)' }}>
                  <Lock size={22} color="#fff" />
              </div>
              <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>Datos Generales del Procedimiento</h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Información del equipo a bloquear</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Nombre del Equipo *</label>
                            <input type="text" value={procedure.equipmentName} onChange={(e) => setProcedure({ ...procedure, equipmentName: e.target.value })} className="input-professional" placeholder="Ej: Compresor Principal" />
                        </div>
                        <div>
                            <label style={labelStyle}>Ubicación</label>
                            <input type="text" value={procedure.location} onChange={(e) => setProcedure({ ...procedure, location: e.target.value })} className="input-professional" placeholder="Ej: Sala de Máquinas" />
                        </div>
                        <div>
                            <label style={labelStyle}>Departamento</label>
                            <input type="text" value={procedure.department} onChange={(e) => setProcedure({ ...procedure, department: e.target.value })} className="input-professional" placeholder="Ej: Mantenimiento" />
                        </div>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Supervisor / Responsable</label>
                            <input type="text" value={procedure.supervisor} onChange={(e) => setProcedure({ ...procedure, supervisor: e.target.value })} className="input-professional" placeholder="Nombre completo" />
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #dc2626, #991b1b)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(220,38,38,0.3)' }}>
                  <span style={{ fontSize: '1.2rem' }}>⚡</span>
              </div>
              <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>Paso 1: Fuentes de Energía</h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Identifique las energías a bloquear</p>
              </div>
            </div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '1.2rem' }}>
                            {ENERGY_TYPES.map(type => {
                                const isSelected = procedure.energyTypes.includes(type.id);
                                return (
                                    <button 
                                        key={type.id} 
                                        onClick={() => toggleEnergy(type.id)} 
                                        style={{ 
                                            padding: '1.5rem 1rem', 
                                            background: isSelected ? `${type.color}15` : 'var(--color-surface)', 
                                            border: `2px solid ${isSelected ? type.color : 'var(--color-border)'}`, 
                                            borderRadius: 'var(--radius-xl)', 
                                            cursor: 'pointer', 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center', 
                                            gap: '0.8rem',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: isSelected ? `0 0 20px ${type.color}30` : '0 2px 4px rgba(0,0,0,0.02)',
                                            transform: isSelected ? 'translateY(-2px)' : 'none'
                                        }}
                                    >
                                        <div style={{ 
                                            fontSize: '2.5rem', 
                                            filter: isSelected ? `drop-shadow(0 0 10px ${type.color})` : 'grayscale(100%) opacity(60%)',
                                            transition: 'all 0.3s'
                                        }}>
                                            {type.icon}
                                        </div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: isSelected ? type.color : 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{type.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(245,158,11,0.3)' }}>
                  <span style={{ fontSize: '1.2rem' }}>🔒</span>
              </div>
              <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>Paso 2: Dispositivos de Bloqueo</h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Elementos LOTO a utilizar</p>
              </div>
            </div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '1rem' }}>
                            {LOTO_DEVICES.map(device => {
                                const isSelected = procedure.lotoDevices.includes(device.id);
                                return (
                                    <button 
                                        key={device.id} 
                                        onClick={() => toggleDevice(device.id)} 
                                        style={{ 
                                            padding: '1rem', 
                                            background: isSelected ? 'var(--color-primary)' : 'var(--color-surface)', 
                                            color: isSelected ? '#fff' : 'var(--color-text)', 
                                            border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`, 
                                            borderRadius: 'var(--radius-xl)', 
                                            cursor: 'pointer', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.75rem', 
                                            fontWeight: 800,
                                            transition: 'all 0.2s',
                                            boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                                        }}
                                    >
                                        <span style={{ fontSize: '1.5rem', filter: isSelected ? 'none' : 'grayscale(100%)' }}>{device.icon}</span>
                                        <span style={{ fontSize: '0.8rem' }}>{device.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <label style={labelStyle}>Puntos de Aislamiento Específicos</label>
                        <input 
                            type="text" 
                            value={procedure.isolationPoints} 
                            onChange={(e) => setProcedure({ ...procedure, isolationPoints: e.target.value })} 
                            className="input-professional" 
                            placeholder="Ej: Interruptor Principal Q1, Válvula Entrada Vapor V-01" 
                        />
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #16a34a, #15803d)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(22,163,74,0.3)' }}>
                  <CheckCircle2 size={22} color="#fff" />
              </div>
              <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>Paso 3: Energía Cero</h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Verificación y try-out</p>
              </div>
            </div>
                        <div style={{ 
                            display: 'flex', flexDirection: 'column', gap: '1.5rem', 
                            background: procedure.zeroEnergyVerification.tested ? 'rgba(16, 185, 129, 0.05)' : 'var(--color-surface)', 
                            padding: '2rem', borderRadius: 'var(--radius-xl)', 
                            border: `2px solid ${procedure.zeroEnergyVerification.tested ? 'var(--color-success)' : 'var(--color-border)'}`,
                            transition: 'all 0.3s'
                        }}>
                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: '1.5rem' }}>
                                <button
                                    onClick={() => setProcedure({ ...procedure, zeroEnergyVerification: { ...procedure.zeroEnergyVerification, tested: !procedure.zeroEnergyVerification.tested } })}
                                    style={{
                                        width: '60px', height: '60px', borderRadius: '50%',
                                        border: `3px solid ${procedure.zeroEnergyVerification.tested ? 'var(--color-success)' : 'var(--color-text-muted)'}`,
                                        background: procedure.zeroEnergyVerification.tested ? 'var(--color-success)' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', transition: 'all 0.3s', flexShrink: 0,
                                        boxShadow: procedure.zeroEnergyVerification.tested ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none'
                                    }}
                                >
                                    {procedure.zeroEnergyVerification.tested ? <CheckCircle2 size={32} color="#fff" /> : <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--color-text-muted)' }}></div>}
                                </button>
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 900, color: procedure.zeroEnergyVerification.tested ? 'var(--color-success)' : 'var(--color-text)' }}>
                                        {procedure.zeroEnergyVerification.tested ? '¡Energía Cero Confirmada!' : 'Confirmar Estado de Energía Cero'}
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                        Es obligatorio probar el arranque del equipo o medir la energía residual antes de iniciar cualquier trabajo.
                                    </p>
                                </div>
                            </div>
                            
                            <div style={{ paddingLeft: isMobile ? '0' : '5.5rem', opacity: procedure.zeroEnergyVerification.tested ? 1 : 0.5, transition: 'opacity 0.3s' }}>
                                <label style={labelStyle}>Método Utilizado para Verificación</label>
                                <select 
                                    value={procedure.zeroEnergyVerification.method} 
                                    onChange={(e) => setProcedure({ ...procedure, zeroEnergyVerification: { ...procedure.zeroEnergyVerification, method: e.target.value } })} 
                                    style={{ ...inputStyle, border: `1px solid ${procedure.zeroEnergyVerification.tested ? 'var(--color-success)' : 'var(--color-border)'}` }}
                                    disabled={!procedure.zeroEnergyVerification.tested}
                                >
                                    <option value="try_start">Intento de Arranque Local (Pulsador)</option>
                                    <option value="tester">Medición con Instrumento (Multímetro/Tester)</option>
                                    <option value="gauge">Verificación de Presión (Manómetro a cero)</option>
                                    <option value="visual">Inspección Visual de Desconexión Física</option>
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

                    {/* Firmas y Autorizaciones */}
                    <div className="card animate-fade-in" style={{ marginTop: '2.5rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                            <Pencil size={22} style={{ color: 'var(--color-primary)' }} /> Firmas y Autorizaciones LOTO
                        </h3>

                        {/* Custom visual switches */}
                        <div className="no-print mb-8 p-6" style={{ background: 'rgba(30, 41, 59, 0.2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ color: 'var(--color-text)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {[
                                    { id: 'operator', label: 'Personal Afectado' },
                                    { id: 'professional', label: 'Especialista Higiene y Seguridad' },
                                    { id: 'supervisor', label: 'Encargado Bloqueo' }
                                ].map(sig => {
                                    const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                                    return (
                                        <label
                                            key={sig.id}
                                            className="flex items-center gap-2 cursor-pointer select-none"
                                            style={{
                                                padding: '0.55rem 1.1rem',
                                                borderRadius: 'var(--radius-full)',
                                                border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                                background: isChecked ? 'rgba(var(--color-primary-rgb), 0.15)' : 'transparent',
                                                color: isChecked ? 'var(--color-primary)' : 'var(--color-text-light)',
                                                fontWeight: 750,
                                                fontSize: '0.8rem',
                                                transition: 'all 0.2s ease',
                                                boxShadow: isChecked ? '0 0 10px rgba(var(--color-primary-rgb), 0.15)' : 'none'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={e => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))}
                                                style={{ display: 'none' }}
                                            />
                                            <div style={{
                                                width: '16px',
                                                height: '16px',
                                                borderRadius: '4px',
                                                border: isChecked ? '2px solid var(--color-primary)' : '2px solid var(--color-text-light)',
                                                background: isChecked ? 'var(--color-primary)' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s ease'
                                            }}>
                                                {isChecked && <CheckCircle2 size={12} color="white" />}
                                            </div>
                                            {sig.label}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* On-Sheet Visual Preview of PDF signature blocks */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            <PdfSignatures
                                data={{
                                    ...procedure,
                                    professionalSignature: professional.signature,
                                    professionalName: professional.name,
                                    professionalLicense: professional.license,
                                    professionalStamp: professional.stamp
                                }}
                                box1={showSignatures.operator ? {
                                    title: 'PERSONAL AFECTADO',
                                    subtitle: 'Firma y Aclaración',
                                    signatureUrl: procedure.operatorSignature || null,
                                    isProfessional: false
                                } : null}
                                box2={showSignatures.professional ? {
                                    title: 'PROFESIONAL H&S',
                                    subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                                    signatureUrl: procedure.professionalSignature || professional.signature || null,
                                    stampUrl: procedure.professionalStamp || professional.stamp || null,
                                    isProfessional: true,
                                    license: professional.license
                                } : null}
                                box3={showSignatures.supervisor ? {
                                    title: 'ENCARGADO BLOQUEO',
                                    subtitle: 'Aprobación / Supervisor',
                                    signatureUrl: procedure.supervisorSignature || procedure.signature || null,
                                    isProfessional: false
                                } : null}
                            />
                        </div>

                        {/* Interactive Signature Drawing Pads */}
                        <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {showSignatures.operator && (
                                <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas 
                                        onSave={(sig) => setProcedure((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                                        initialImage={procedure.operatorSignature}
                                        title="Firma de Personal Afectado"
                                    />
                                </div>
                            )}
                            
                            {showSignatures.professional && (
                                <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas 
                                        onSave={(sig) => setProcedure((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                                        initialImage={procedure.professionalSignature || professional.signature}
                                        title="Firma de Especialista H&S"
                                    />
                                </div>
                            )}

                            {showSignatures.supervisor && (
                                <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas 
                                        onSave={(sig) => setProcedure((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                                        initialImage={procedure.supervisorSignature || procedure.signature}
                                        title="Firma de Encargado Bloqueo"
                                    />
                                </div>
                            )}
                        </div>
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
                    onClick={(e) => { e.preventDefault(); requirePro(handleSave); }}
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

            <div className="print-only" style={{ position: 'fixed', left: 0, opacity: 0.01, top: 0 }}>
                <LOTOPdf data={{ ...procedure, id: (procedure as any).id || Date.now().toString(), createdAt: (procedure as any).createdAt || new Date().toISOString() }} />
            </div>
        </div>
    );
}

