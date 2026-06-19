import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, RefreshCw, Shield, AlertTriangle, Clock, CheckCircle2, User, Calendar, FileText, Target, Info, Eye, Printer, Share2, Pencil } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import CAPAPdf from '../components/CAPAPdf';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

const CAPA_TYPES = [
    { id: 'corrective', name: 'Correctiva', icon: '🔧' },
    { id: 'preventive', name: 'Preventiva', icon: '🛡️' },
    { id: 'improvement', name: 'Mejora', icon: '📈' },
    { id: 'containment', name: 'Contención', icon: '🚨' }
];

const PRIORITY = {
    critical: { label: 'CRÍTICA', color: '#dc2626', days: 3, icon: '🚨' },
    high: { label: 'ALTA', color: '#f59e0b', days: 7, icon: '⚠️' },
    medium: { label: 'MEDIA', color: '#3b82f6', days: 15, icon: 'ℹ️' },
    low: { label: 'BAJA', color: '#16a34a', days: 30, icon: '✅' }
};

const labelStyle = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 800,
    color: 'var(--color-text)',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
};

const inputStyle = (isMobile: boolean) => ({
    width: '100%',
    padding: isMobile ? '0.75rem 0.85rem' : '0.85rem 1rem',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-input-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontSize: isMobile ? '0.85rem' : '0.95rem',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box' as const
});

export default function CAPAForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
  const { isPro } = usePaywall();

    const [showSignatures, setShowSignatures] = useState({
        operator: true,
        supervisor: true,
        professional: true
    });

    const [professional, setProfessional] = useState({
        name: '',
        license: '',
        signature: null as string | null,
        stamp: null as string | null
    });

    useDocumentTitle(isEdit ? 'Editar Acción CAPA' : 'Nueva Acción CAPA');
    const [capa, setCapa] = useState({
        id: `CAPA-${Date.now()}`,
        createdAt: new Date().toISOString(),
        title: '',
        capaType: 'corrective',
        priority: 'medium',
        responsible: '',
        dueDate: '',
        description: '',
        rootCause: {
            why1: '',
            why2: '',
            why3: '',
            why4: '',
            why5: '',
            finalCause: ''
        },
        actionPlan: '',
        verification: {
            implemented: false,
            effective: false,
            comments: ''
        },
        tags: [],
        signature: '',
        operatorSignature: '',
        supervisorSignature: '',
        showSignatures: {
            operator: true,
            supervisor: true,
            professional: true
        }
    });

    // Cargar datos del profesional
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
            setProfessional(prev => ({ ...prev, signature, stamp }));
        }
    }, []);

    useEffect(() => {
        if (location.state?.editData) {
            const editData = location.state.editData;
            setCapa({
                ...editData,
                operatorSignature: editData.operatorSignature || '',
                supervisorSignature: editData.supervisorSignature || '',
                signature: editData.signature || '',
                showSignatures: editData.showSignatures || { operator: true, supervisor: true, professional: true }
            });
            if (editData.showSignatures) {
                setShowSignatures(editData.showSignatures);
            }
            setIsEdit(true);
        }
    }, [location.state]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleSave = () => {
        if (!capa.title || !capa.description) {
            toast.error('Por favor complete los campos obligatorios (*)');
            return;
        }

        const saved = JSON.parse(localStorage.getItem('ehs_capa_db') || '[]');
        let updated;

        if (isEdit) {
            updated = saved.map((c: any) => c.id === capa.id ? { ...capa, showSignatures } : c);
            toast.success('Acción CAPA actualizada');
        } else {
            const newCapa = {
                ...capa,
                id: `CAPA-${Date.now()}`,
                createdAt: new Date().toISOString(),
                status: 'open',
                showSignatures
            };
            updated = [newCapa, ...saved];
            toast.success('Acción CAPA guardada');
        }

        localStorage.setItem('ehs_capa_db', JSON.stringify(updated));
        navigate('/capa');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '4rem' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '4.5rem 1rem 1rem' : '5.5rem 2rem 2rem' }}>
                <Breadcrumbs />
                <PremiumHeader 
                    title={isEdit ? 'Editar Acción CAPA' : 'Nueva Acción CAPA'}
                    subtitle={isEdit ? 'Actualice la información de la acción correctiva o preventiva en curso.' : 'Registre una nueva acción para el proceso de mejora continua.'}
                    icon={<Shield size={32} color="#ffffff" />}
                />
                
                <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                    <></>
                </div>
            </div>

            <main style={{ padding: isMobile ? '0 1rem 1.5rem' : '0 1.5rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="capa-card" style={{ padding: isMobile ? '1.25rem' : '2rem', borderRadius: isMobile ? '1rem' : 'var(--radius-2xl)', background: 'var(--color-surface)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-sm)' }}>
                    <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Target size={20} color="#3b82f6" />
                        Metadatos Principales
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '1.5rem' }}>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div style={{ background: '#eff6ff', padding: '4px', borderRadius: '4px' }}><FileText size={16} color="#3b82f6" /></div>
                                <label style={{ ...labelStyle, margin: 0 }}>Título de la Acción *</label>
                            </div>
                            <input
                                type="text"
                                value={capa.title}
                                onChange={(e) => setCapa({ ...capa, title: e.target.value })}
                                style={{...inputStyle(isMobile), background: 'rgba(248, 250, 252, 0.5)'}}
                                className="capa-focus-glow"
                                placeholder="Ej: Fugas detectadas en sector de químicos"
                            />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div style={{ background: '#f0fdf4', padding: '4px', borderRadius: '4px' }}><Shield size={16} color="#16a34a" /></div>
                                <label style={{ ...labelStyle, margin: 0 }}>Tipo de Acción</label>
                            </div>
                            <select
                                value={capa.capaType}
                                onChange={(e) => setCapa({ ...capa, capaType: e.target.value })}
                                style={{...inputStyle(isMobile), background: 'rgba(248, 250, 252, 0.5)'}}
                                className="capa-focus-glow"
                            >
                                {CAPA_TYPES.map(t => (
                                    <option key={t.id} value={t.id} style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                                        {t.icon} {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div style={{ background: '#fef3c7', padding: '4px', borderRadius: '4px' }}><AlertTriangle size={16} color="#d97706" /></div>
                                <label style={{ ...labelStyle, margin: 0 }}>Prioridad</label>
                            </div>
                            <select
                                value={capa.priority}
                                onChange={(e) => setCapa({ ...capa, priority: e.target.value })}
                                style={{...inputStyle(isMobile), background: 'rgba(248, 250, 252, 0.5)'}}
                                className="capa-focus-glow"
                            >
                                {Object.entries(PRIORITY).map(([k, v]) => (
                                    <option key={k} value={k} style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                                        {v.icon} {v.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <User size={16} style={{ color: 'var(--color-primary-light)' }} />
                                <label style={{ ...labelStyle, margin: 0 }}>Responsable</label>
                            </div>
                            <input
                                type="text"
                                value={capa.responsible}
                                onChange={(e) => setCapa({ ...capa, responsible: e.target.value })}
                                style={inputStyle(isMobile)}
                                className="capa-focus-glow"
                                placeholder="Nombre del responsable"
                            />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Calendar size={16} style={{ color: 'var(--color-primary-light)' }} />
                                <label style={{ ...labelStyle, margin: 0 }}>Fecha Límite</label>
                            </div>
                            <input
                                type="date"
                                value={capa.dueDate}
                                onChange={(e) => setCapa({ ...capa, dueDate: e.target.value })}
                                style={inputStyle(isMobile)}
                                className="capa-focus-glow"
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Info size={16} style={{ color: 'var(--color-primary-light)' }} />
                            <label style={{ ...labelStyle, margin: 0 }}>Descripción del Problema / No Conformidad *</label>
                        </div>
                        <textarea 
                            value={capa.description} 
                            onChange={(e) => setCapa({ ...capa, description: e.target.value })} 
                            style={{ ...inputStyle(isMobile), minHeight: isMobile ? '80px' : '100px', paddingTop: '0.75rem' }} 
                            className="capa-focus-glow"
                            placeholder="Describa de manera clara y precisa la no conformidad o problema detectado..."
                        />
                    </div>

                    <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border-subtle)' }}>
                        <h3 style={{
                            margin: '0 0 1.5rem 0',
                            fontSize: '1.25rem',
                            fontWeight: 900,
                            color: 'var(--color-primary-light)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            letterSpacing: '0.5px'
                        }}>
                            <Clock size={20} /> ANÁLISIS DE CAUSA RAÍZ (5 PORQUÉS)
                        </h3>
                        <div className="capa-why-container">
                            <div className="capa-why-timeline" />
                            {[1, 2, 3, 4, 5].map(num => (
                                <div key={num} className="capa-why-node">
                                    <div className="capa-why-badge">{num}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                            {num}° Porqué
                                        </label>
                                        <input 
                                            type="text" 
                                            value={capa.rootCause[`why${num}` as keyof typeof capa.rootCause]} 
                                            onChange={(e) => setCapa({ ...capa, rootCause: { ...capa.rootCause, [`why${num}`]: e.target.value } })} 
                                            style={{ ...inputStyle(isMobile), border: 'none', background: 'transparent', padding: '0.4rem 0', borderBottom: '1px solid var(--color-input-border)', borderRadius: 0 }} 
                                            className="capa-focus-glow"
                                            placeholder={`¿Por qué ocurrió el paso anterior?`} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="capa-why-node capa-why-final-container" style={{ marginTop: '1.5rem', padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <Target size={18} style={{ color: '#10b981' }} />
                                <label style={{ ...labelStyle, margin: 0, color: '#10b981' }}>Causa Raíz Final Identificada</label>
                            </div>
                            <input 
                                type="text" 
                                value={capa.rootCause.finalCause} 
                                onChange={(e) => setCapa({ ...capa, rootCause: { ...capa.rootCause, finalCause: e.target.value } })} 
                                style={{ ...inputStyle(isMobile), background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(16, 185, 129, 0.3)' }} 
                                className="capa-focus-glow"
                                placeholder="La causa fundamental identificada es..." 
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border-subtle)' }}>
                        <h3 style={{
                            margin: '0 0 1.5rem 0',
                            fontSize: '1.25rem',
                            fontWeight: 900,
                            color: 'var(--color-primary-light)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            letterSpacing: '0.5px'
                        }}>
                            <Target size={20} /> PLAN DE ACCIÓN Y VERIFICACIÓN
                        </h3>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <FileText size={16} style={{ color: 'var(--color-primary-light)' }} />
                                <label style={{ ...labelStyle, margin: 0 }}>Acciones Correctivas / Preventivas Detalladas</label>
                            </div>
                            <textarea 
                                value={capa.actionPlan} 
                                onChange={(e) => setCapa({ ...capa, actionPlan: e.target.value })} 
                                style={{ ...inputStyle(isMobile), minHeight: isMobile ? '100px' : '120px' }} 
                                className="capa-focus-glow"
                                placeholder="1. Reparar... 2. Capacitar... 3. Modificar procedimiento..." 
                            />
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '1.5rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)', padding: isMobile ? '1rem' : '1.5rem', borderRadius: isMobile ? '1rem' : 'var(--radius-xl)' }}>
                            <div className="capa-verify-pill-group">
                                <button
                                    type="button"
                                    onClick={() => setCapa({ ...capa, verification: { ...capa.verification, implemented: !capa.verification.implemented } })}
                                    className={`capa-verify-pill ${capa.verification.implemented ? 'capa-verify-pill-active-imp' : ''}`}
                                    style={{ border: '1px solid var(--glass-border)' }}
                                >
                                    <CheckCircle2 size={18} style={{ color: capa.verification.implemented ? '#10b981' : 'var(--color-text-muted)' }} />
                                    <span>Implementación Verificada</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCapa({ ...capa, verification: { ...capa.verification, effective: !capa.verification.effective } })}
                                    className={`capa-verify-pill ${capa.verification.effective ? 'capa-verify-pill-active-eff' : ''}`}
                                    style={{ border: '1px solid var(--glass-border)' }}
                                >
                                    <CheckCircle2 size={18} style={{ color: capa.verification.effective ? '#3b82f6' : 'var(--color-text-muted)' }} />
                                    <span>Eficacia Comprobada</span>
                                </button>
                            </div>
                            <div>
                                <label style={labelStyle}>Comentarios de Verificación</label>
                                <textarea 
                                    value={capa.verification.comments} 
                                    onChange={(e) => setCapa({ ...capa, verification: { ...capa.verification, comments: e.target.value } })} 
                                    style={{ ...inputStyle(isMobile), minHeight: isMobile ? '80px' : '94px', fontSize: '0.85rem' }} 
                                    className="capa-focus-glow"
                                    placeholder="Resultados de la verificación de eficacia..." 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="capa-card" style={{ marginTop: '3rem', borderRadius: 'var(--radius-2xl)', padding: '2rem' }}>
                        <h3 style={{
                            marginTop: 0,
                            marginBottom: '2rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.7rem',
                            color: 'var(--color-primary-light)',
                            fontWeight: 900,
                            fontSize: '1.25rem',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            <Pencil size={24} /> Firmas y Autorizaciones
                        </h3>

                        <div className="no-print" style={{
                            marginBottom: '2.5rem',
                            padding: isMobile ? '1rem' : '1.5rem',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--glass-border-subtle)',
                            borderRadius: 'var(--radius-xl)',
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: '1.5rem',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                INCLUIR FIRMAS EN EL DOCUMENTO:
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {[
                                    { id: 'operator', label: 'Responsable / Operador', active: showSignatures.operator },
                                    { id: 'professional', label: 'Profesional Actuante', active: showSignatures.professional },
                                    { id: 'supervisor', label: 'Supervisión / Cierre', active: showSignatures.supervisor }
                                ].map(item => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setShowSignatures(s => ({ ...s, [item.id]: !s[item.id as keyof typeof showSignatures] }))}
                                        style={{
                                            padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem',
                                            borderRadius: '20px',
                                            border: '1px solid',
                                            borderColor: item.active ? 'var(--color-primary)' : 'var(--color-border)',
                                            background: item.active ? 'rgba(var(--color-primary-rgb), 0.1)' : 'transparent',
                                            color: item.active ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: item.active ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s'
                                        }}>
                                            {item.active && <CheckCircle2 size={8} color="#fff" />}
                                        </div>
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* On-Sheet Visual Preview of PDF signature blocks */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            <PdfSignatures
                                data={{
                                    ...capa,
                                    professionalSignature: professional.signature,
                                    professionalName: professional.name,
                                    professionalLicense: professional.license,
                                    professionalStamp: professional.stamp
                                }}
                                box1={showSignatures.operator ? {
                                    title: 'RESPONSABLE / OPERADOR',
                                    subtitle: 'Firma de Conformidad',
                                    signatureUrl: capa.operatorSignature || null,
                                    isProfessional: false
                                } : null}
                                box2={showSignatures.professional ? {
                                    title: 'PROFESIONAL ACTUANTE',
                                    subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                                    signatureUrl: capa.signature || professional.signature || null,
                                    stampUrl: professional.stamp || null,
                                    isProfessional: true,
                                    license: professional.license
                                } : null}
                                box3={showSignatures.supervisor ? {
                                    title: 'SUPERVISIÓN / CIERRE',
                                    subtitle: 'Aprobación y Cierre CAPA',
                                    signatureUrl: capa.supervisorSignature || null,
                                    isProfessional: false
                                } : null}
                            />
            <PdfBrandingFooter />
                        </div>

                        {/* Interactive Signature Drawing Pads inside custom glass cards */}
                        <div className="no-print" style={{
                            marginTop: '2rem',
                            paddingTop: '2rem',
                            borderTop: '1px solid var(--glass-border-subtle)',
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {showSignatures.operator && (
                                <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--glass-border)' }}>
                                    <SignatureCanvas 
                                        onSave={(sig) => setCapa(prev => ({ ...prev, operatorSignature: sig || '' }))}
                                        initialImage={capa.operatorSignature}
                                        label="Firma de Responsable / Operador"
                                    />
                                </div>
                            )}
                            
                            {showSignatures.professional && (
                                <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--glass-border)' }}>
                                    <SignatureCanvas 
                                        onSave={(sig) => setCapa(prev => ({ ...prev, signature: sig || '' }))}
                                        initialImage={capa.signature}
                                        label="Firma de Profesional Actuante"
                                    />
                                </div>
                            )}

                            {showSignatures.supervisor && (
                                <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--glass-border)' }}>
                                    <SignatureCanvas 
                                        onSave={(sig) => setCapa(prev => ({ ...prev, supervisorSignature: sig || '' }))}
                                        initialImage={capa.supervisorSignature}
                                        label="Firma de Supervisión / Cierre"
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
                    <Save size={18} /> GUARDAR CAPA
                </button>
            </div>

            <ShareModal
                isOpen={showShareModal}
                open={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Acción CAPA"
                rawMessage={`Acción CAPA: ${capa.title}`}
                text={`Acción CAPA: ${capa.title}`}
                fileName={`CAPA_${capa.title || 'Sin_Nombre'}.pdf`}
            />

            <div className="print-only" id="pdf-content" style={{ position: 'fixed', left: '-9999px', top: 0, opacity: 0.01, pointerEvents: 'none' }}>
                <CAPAPdf data={{ ...capa, showSignatures, createdAt: capa.createdAt || new Date().toISOString() }} />
            </div>
        </div>
    );
}

