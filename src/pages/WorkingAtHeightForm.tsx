import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, ArrowDown, Shield, AlertTriangle, Clock, CheckCircle2, User, MapPin, Ruler, Eye, Printer, Share2, Pencil } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import WorkingAtHeightPdf from '../components/WorkingAtHeightPdf';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import PremiumHeader from '../components/PremiumHeader';

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

export default function WorkingAtHeightForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
  const { isPro } = usePaywall();

    useDocumentTitle(isEdit ? 'Editar Permiso en Altura' : 'Permiso de Trabajo en Altura');
    
    const [permit, setPermit] = useState<any>({
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
        },
        signature: '',
        operatorSignature: '',
        professionalSignature: '',
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
        setPermit((prev: any) => {
            const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
            return { ...prev, showSignatures: updated };
        });
    };

    const showSignatures = permit.showSignatures || { operator: true, professional: true, supervisor: true };

    useEffect(() => {
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
    }, []);

    useEffect(() => {
        if (location.state?.editData) {
            const editData = location.state.editData;
            setPermit({
                ...editData,
                operatorSignature: editData.operatorSignature || '',
                professionalSignature: editData.professionalSignature || '',
                supervisorSignature: editData.supervisorSignature || editData.signature || '',
                signature: editData.signature || editData.supervisorSignature || '',
                showSignatures: editData.showSignatures || { operator: true, professional: true, supervisor: true }
            });
            setIsEdit(true);
        }
    }, [location.state]);


    useEffect(() => {
        window.scrollTo(0, 0);
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSave = () => {
        if (!permit.workerName || !permit.height) {
            toast.error('Por favor complete los campos obligatorios (*)');
            return;
        }

        const saved = JSON.parse(localStorage.getItem('working_height_permits_db') || '[]');
        let updated;

        const permitWithSignatures = {
            ...permit,
            professionalSignature: permit.professionalSignature || professional.signature,
            professionalName: permit.professionalName || professional.name,
            professionalLicense: permit.professionalLicense || professional.license,
            professionalStamp: permit.professionalStamp || professional.stamp
        };

        if (isEdit) {
            updated = saved.map((p: any) => p.id === (permit as any).id ? permitWithSignatures : p);
            toast.success('Permiso actualizado');
        } else {
            const newPermit = {
                ...permitWithSignatures,
                id: `WAH-${Date.now()}`,
                createdAt: new Date().toISOString(),
                status: 'pending'
            };
            updated = [newPermit, ...saved];
            toast.success('Permiso guardado');
        }

        localStorage.setItem('working_height_permits_db', JSON.stringify(updated));

        if (isEdit && (permit as any).status === 'active') {
            const activeSaved = JSON.parse(localStorage.getItem('working_height_active_db') || '[]');
            const updatedActive = activeSaved.map((p: any) => p.id === (permit as any).id ? permitWithSignatures : p);
            localStorage.setItem('working_height_active_db', JSON.stringify(updatedActive));
        }

        navigate('/working-at-height');
    };


    const labelStyle = {
        display: 'block',
        marginBottom: '0.5rem',
        fontSize: '0.9rem',
        fontWeight: 600,
        color: 'var(--color-text-muted)'
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        background: 'var(--color-background)',
        color: 'var(--color-text)',
        fontSize: '1rem',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        appearance: 'none'
    } as any;

    return (
        <div className="container page-transition" style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '4rem' }}>
            <main style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div className="no-print" style={{ marginBottom: '2rem' }}>
                    <PremiumHeader 
                        title={isEdit ? 'Editar Permiso en Altura' : 'Permiso de Trabajo en Altura'}
                        subtitle="Gestión de permisos según OSHA 1926.501"
                        icon={<ArrowDown size={32} color="#ffffff" />}
                        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            onClick={() => navigate(-1)}
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
                </div>

                <div className="card animate-fade-in" style={{ padding: '2.5rem', background: 'rgba(var(--color-surface-rgb), 0.3)', borderTop: '4px solid #f59e0b', borderRadius: 'var(--radius-xl)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Nombre del Trabajador *</label>
                            <input type="text" value={permit.workerName} onChange={(e) => setPermit({ ...permit, workerName: e.target.value })} style={inputStyle} placeholder="Nombre completo" />
                        </div>
                        <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
                            <label style={labelStyle}>Tipo de Trabajo</label>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '1rem' }}>
                                {WORK_TYPES.map(t => (
                                    <button 
                                        key={t.id} 
                                        onClick={() => setPermit({ ...permit, workType: t.id })}
                                        style={{ 
                                            padding: '1rem', 
                                            background: permit.workType === t.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-background)', 
                                            border: `2px solid ${permit.workType === t.id ? 'var(--color-primary)' : 'var(--color-border)'}`, 
                                            borderRadius: 'var(--radius-xl)', 
                                            cursor: 'pointer', 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center', 
                                            gap: '0.5rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <span style={{ fontSize: '2rem' }}>{t.icon}</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: permit.workType === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>{t.name}</span>
                                    </button>
                                ))}
                            </div>
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
                        <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
                            <label style={labelStyle}>Prioridad / Riesgo</label>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '1rem' }}>
                                {Object.entries(PRIORITY).map(([k, v]) => (
                                    <button
                                        key={k}
                                        onClick={() => setPermit({ ...permit, priority: k })}
                                        style={{
                                            padding: '1rem',
                                            background: permit.priority === k ? `${v.color}15` : 'var(--color-background)',
                                            border: `2px solid ${permit.priority === k ? v.color : 'var(--color-border)'}`,
                                            borderRadius: 'var(--radius-xl)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            fontWeight: 800,
                                            color: permit.priority === k ? v.color : 'var(--color-text-muted)',
                                            transition: 'all 0.2s',
                                            boxShadow: permit.priority === k ? `0 0 15px ${v.color}30` : 'none'
                                        }}
                                    >
                                        <span style={{ fontSize: '1.2rem' }}>{v.icon}</span>
                                        {v.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Validación Legal (Res. SRT 61/23)</h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{
                                    padding: '1.5rem',
                                    background: permit.medicalFitness ? 'rgba(16, 185, 129, 0.05)' : 'rgba(220, 38, 38, 0.05)',
                                    border: `2px dashed ${permit.medicalFitness ? 'var(--color-success)' : '#dc2626'}`,
                                    borderRadius: 'var(--radius-xl)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <button
                                            onClick={() => setPermit({ ...permit, medicalFitness: !permit.medicalFitness })}
                                            style={{
                                                width: '40px', height: '40px', borderRadius: '50%',
                                                border: `3px solid ${permit.medicalFitness ? 'var(--color-success)' : '#dc2626'}`,
                                                background: permit.medicalFitness ? 'var(--color-success)' : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                                transition: 'all 0.2s', flexShrink: 0
                                            }}
                                        >
                                            {permit.medicalFitness && <CheckCircle2 size={24} color="#fff" />}
                                        </button>
                                        <div>
                                            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: permit.medicalFitness ? 'var(--color-success)' : '#dc2626', display: 'block' }}>
                                                Apto Médico Vigente
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                {permit.medicalFitness ? 'Verificado y habilitado para tareas en altura' : '¡ATENCIÓN! No puede realizar tareas sin apto médico'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

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

                    {/* Firmas y Autorizaciones */}
                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Pencil size={20} /> Firmas y Autorizaciones del Permiso
                        </h3>

                        <div className="no-print" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <span style={{ display: 'inline-block', borderBottom: '2px solid var(--color-primary)', paddingBottom: '2px' }}>Personalizar Firmas del Documento</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {[
                                    { id: 'operator', label: 'Operador / Trabajador' },
                                    { id: 'professional', label: 'Especialista H&S' },
                                    { id: 'supervisor', label: 'Supervisor' }
                                ].map(role => (
                                    <button
                                        key={role.id}
                                        onClick={() => setShowSignatures((s: any) => ({ ...s, [role.id]: !s[role.id] }))}
                                        style={{
                                            padding: '0.6rem 1.2rem',
                                            borderRadius: 'var(--radius-full)',
                                            border: `2px solid ${showSignatures[role.id] ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                            background: showSignatures[role.id] ? 'var(--color-primary)' : 'transparent',
                                            color: showSignatures[role.id] ? 'white' : 'var(--color-text-muted)',
                                            fontWeight: 700,
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            boxShadow: showSignatures[role.id] ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                                        }}
                                    >
                                        <div style={{
                                            width: '18px', height: '18px', borderRadius: '50%',
                                            border: `2px solid ${showSignatures[role.id] ? 'white' : 'var(--color-border)'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: showSignatures[role.id] ? 'white' : 'transparent'
                                        }}>
                                            {showSignatures[role.id] && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-primary)' }} />}
                                        </div>
                                        {role.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* On-Sheet Visual Preview of PDF signature blocks */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            <PdfSignatures
                                data={{
                                    ...permit,
                                    professionalSignature: professional.signature,
                                    professionalName: professional.name,
                                    professionalLicense: professional.license,
                                    professionalStamp: professional.stamp
                                }}
                                box1={showSignatures.operator ? {
                                    title: 'OPERADOR / TRABAJADOR',
                                    subtitle: (permit.workerName || 'Firma del Operador').toUpperCase(),
                                    signatureUrl: permit.operatorSignature || null,
                                    isProfessional: false
                                } : null}
                                box2={showSignatures.professional ? {
                                    title: 'PROFESIONAL H&S',
                                    subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                                    signatureUrl: permit.professionalSignature || professional.signature || null,
                                    stampUrl: permit.professionalStamp || professional.stamp || null,
                                    isProfessional: true,
                                    license: professional.license
                                } : null}
                                box3={showSignatures.supervisor ? {
                                    title: 'SUPERVISOR / AUTORIZANTE',
                                    subtitle: (permit.supervisor || 'Firma del Supervisor').toUpperCase(),
                                    signatureUrl: permit.supervisorSignature || permit.signature || null,
                                    isProfessional: false
                                } : null}
                            />
                        </div>

                        {/* Interactive Signature Drawing Pads */}
                        <div className="no-print animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                                {showSignatures.operator && (
                                    <div className="card" style={{ padding: '1rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)' }}>
                                        <SignatureCanvas 
                                            onSave={(sig) => setPermit((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                                            initialImage={permit.operatorSignature}
                                            label="Firma del Operador / Trabajador"
                                        />
                                    </div>
                                )}
                                
                                {showSignatures.professional && (
                                    <div className="card" style={{ padding: '1rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)' }}>
                                        <SignatureCanvas 
                                            onSave={(sig) => setPermit((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                                            initialImage={permit.professionalSignature || professional.signature}
                                            label="Firma de Especialista H&S"
                                        />
                                    </div>
                                )}

                                {showSignatures.supervisor && (
                                    <div className="card" style={{ padding: '1rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)' }}>
                                        <SignatureCanvas 
                                            onSave={(sig) => setPermit((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                                            initialImage={permit.supervisorSignature || permit.signature}
                                            label="Firma del Supervisor / Autorizante"
                                        />
                                    </div>
                                )}
                            </div>
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
                    <Save size={18} /> GUARDAR PERMISO
                </button>
            </div>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Permiso Trabajo en Altura"
                fileName={`Altura_${permit.workerName || 'Sin_Nombre'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: 0, opacity: 0.01, top: 0 }}>
                <WorkingAtHeightPdf data={{ ...permit, createdAt: (permit as any).createdAt || new Date().toISOString() } as any} />
            </div>
        </div>
    );
}

