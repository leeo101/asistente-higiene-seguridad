import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, ClipboardCheck, Shield, AlertTriangle, Clock, CheckCircle2, User, MapPin, Calendar, FileText, Eye, Printer, Share2, Pencil, Award } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import AuditPdf from '../components/AuditPdf';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

const AUDIT_TYPES = [
    { id: 'internal', name: 'Interna', icon: '📋' },
    { id: 'external', name: 'Externa', icon: '🏢' },
    { id: 'certification', name: 'Certificación', icon: '📜' },
    { id: 'surveillance', name: 'Seguimiento', icon: '👁️' },
    { id: 'compliance', name: 'Cumplimiento Legal', icon: '⚖️' }
];

const ISO_CHECKLIST_BASE: any = {
    context: [
        { id: '4.1', question: '¿Se determinaron las cuestiones internas y externas relevantes?', legal: 'ISO 45001 4.1' },
        { id: '4.2', question: '¿Se identificaron las partes interesadas y sus necesidades?', legal: 'ISO 45001 4.2' },
        { id: '4.3', question: '¿Está definido el alcance del SGSST?', legal: 'ISO 45001 4.3' }
    ],
    leadership: [
        { id: '5.1', question: '¿La dirección demuestra liderazgo y compromiso?', legal: 'ISO 45001 5.1' },
        { id: '5.2', question: '¿Existe una política de SST documentada?', legal: 'ISO 45001 5.2' },
        { id: '5.4', question: '¿Se consulta y participa a los trabajadores?', legal: 'ISO 45001 5.4' }
    ],
    planning: [
        { id: '6.1', question: '¿Se identifican peligros y evalúan riesgos?', legal: 'ISO 45001 6.1' },
        { id: '6.1.2', question: '¿Se determinan requisitos legales aplicables?', legal: 'ISO 45001 6.1.2' },
        { id: '6.2', question: '¿Existen objetivos de SST medibles?', legal: 'ISO 45001 6.2' }
    ],
    support: [
        { id: '7.2', question: '¿El personal es competente para sus tareas?', legal: 'ISO 45001 7.2' },
        { id: '7.4', question: '¿Existen procesos de comunicación interna/externa?', legal: 'ISO 45001 7.4' },
        { id: '7.5', question: '¿Se controla la información documentada?', legal: 'ISO 45001 7.5' }
    ],
    operation: [
        { id: '8.1.1', question: '¿Existe jerarquía de controles de riesgo?', legal: 'ISO 45001 8.1.1' },
        { id: '8.1.3', question: '¿Se gestionan compras y contratistas?', legal: 'ISO 45001 8.1.3' },
        { id: '8.1.4', question: '¿Existe preparación y respuesta ante emergencias?', legal: 'ISO 45001 8.1.4' }
    ],
    performance: [
        { id: '9.1', question: '¿Se realiza seguimiento y medición del desempeño?', legal: 'ISO 45001 9.1' },
        { id: '9.2', question: '¿Se realiza auditoría interna periódica?', legal: 'ISO 45001 9.2' }
    ],
    improvement: [
        { id: '10.2', question: '¿Se toman acciones correctivas?', legal: 'ISO 45001 10.2' },
        { id: '10.3', question: '¿Existe mejora continua del sistema?', legal: 'ISO 45001 10.3' }
    ]
};

const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 800,
    color: 'var(--color-text)',
    marginBottom: '0.5rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
};

const getStatusStyles = (status: string, isSelected: boolean) => {
    if (!isSelected) {
        return {
            background: 'transparent',
            color: 'var(--color-text-muted)',
            borderColor: 'transparent',
            opacity: 0.8,
            boxShadow: 'none'
        };
    }
    switch (status) {
        case 'si':
            return {
                background: '#10b981',
                color: '#ffffff',
                borderColor: '#10b981',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                opacity: 1
            };
        case 'no':
            return {
                background: '#ef4444',
                color: '#ffffff',
                borderColor: '#ef4444',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                opacity: 1
            };
        case 'na':
        default:
            return {
                background: '#64748b',
                color: '#ffffff',
                borderColor: '#64748b',
                boxShadow: '0 2px 8px rgba(100, 116, 139, 0.4)',
                opacity: 1
            };
    }
};

export default function AuditForm(): React.ReactElement | null {
    const { requirePro } = usePaywall();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

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

    useDocumentTitle(isEdit ? 'Editar Auditoría EHS' : 'Nueva Auditoría EHS');
    const [audit, setAudit] = useState({
        id: `AUD-${Date.now()}`,
        createdAt: new Date().toISOString(),
        title: '',
        auditType: 'internal',
        auditor: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        objective: '',
        scope: '',
        checklist: [] as any[],
        closingMeeting: {
            date: '',
            participants: '',
            conclusions: ''
        },
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
            setAudit({
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
        } else if (location.state?.selectedAreas) {
            // Build checklist from selected areas in Manager
            const newChecklist: any[] = [];
            location.state.selectedAreas.forEach((areaId: string) => {
                const items = ISO_CHECKLIST_BASE[areaId] || [];
                items.forEach((item: any) => {
                    newChecklist.push({
                        ...item,
                        status: 'na',
                        observation: ''
                    });
                });
            });
            setAudit(prev => ({ ...prev, checklist: newChecklist }));
        } else if (!isEdit && audit.checklist.length === 0) {
            // Default 5-item quick checklist if no areas selected
            setAudit(prev => ({
                ...prev,
                checklist: [
                    { id: 1, question: '¿Cuenta con Seguro de Vida Obligatorio?', legal: 'Ley 16.600', status: 'na', observation: '' },
                    { id: 2, question: '¿Se exhibe el Afiche de la ART?', legal: 'Res. SRT 70/97', status: 'na', observation: '' },
                    { id: 3, question: '¿Cuenta con Registro de Entrega de EPP?', legal: 'Res. SRT 299/11', status: 'na', observation: '' },
                    { id: 4, question: '¿Están señalizadas las salidas de emergencia?', legal: 'Ley 19.587 Cap 18', status: 'na', observation: '' },
                    { id: 5, question: '¿Extintores con carga vigente?', legal: 'DPS 351/79', status: 'na', observation: '' }
                ]
            }));
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
        if (!audit.title || !audit.auditor) {
            toast.error('Por favor complete los campos obligatorios (*)');
            return;
        }

        const saved = JSON.parse(localStorage.getItem('ehs_audits_db') || '[]');
        let updated;

        if (isEdit) {
            updated = saved.map((a: any) => a.id === audit.id ? { ...audit, showSignatures } : a);
            toast.success('Auditoría actualizada');
        } else {
            const newAudit = {
                ...audit,
                showSignatures,
                id: `AUD-${Date.now()}`,
                createdAt: new Date().toISOString(),
                status: 'planned'
            };
            updated = [newAudit, ...saved];
            toast.success('Auditoría guardada');
        }

        localStorage.setItem('ehs_audits_db', JSON.stringify(updated));
        navigate('/audit');
    };

    return (
        <div className="container" style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '7rem', paddingTop: isMobile ? '4.5rem' : '5.5rem' }}>
            <Breadcrumbs />
            <PremiumHeader 
                title={isEdit ? 'Editar Auditoría' : 'Nueva Auditoría EHS'}
                subtitle={isEdit ? 'Actualice la información de la auditoría en curso.' : 'Registre una nueva inspección o auditoría para evaluar el cumplimiento de EHS.'}
                icon={<Shield size={32} color="#ffffff" />}
            />

            <div style={{ maxWidth: '1000px', margin: '1rem auto 0', padding: '0 1rem', display: 'flex' }}>
                <></>
            </div>

            <main style={{ padding: '0 0 2rem 0', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                <div className="card animate-fade-in" style={{ padding: '2.5rem', background: 'linear-gradient(145deg, var(--color-surface) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '24px', boxShadow: '0 10px 40px -10px rgba(16, 185, 129, 0.1)' }}>
                    {/* Metadatos Principales */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
                        gap: '1.25rem',
                        background: 'rgba(248, 250, 252, 0.5)',
                        padding: '1.5rem',
                        borderRadius: '16px',
                        border: '1px solid var(--color-border)'
                    }}>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Título de la Auditoría *</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    className="input-professional"
                                    style={{ paddingLeft: '2.8rem', marginBottom: 0, height: '48px', fontSize: '1rem' }}
                                    value={audit.title}
                                    onChange={(e) => setAudit({ ...audit, title: e.target.value })}
                                    placeholder="Ej: Auditoría Interna Trimestral - Planta Norte"
                                />
                                <div style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'var(--color-primary-light)', padding: '0.4rem', borderRadius: '8px', color: 'white', display: 'flex' }}>
                                    <FileText size={16} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Tipo de Auditoría</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={audit.auditType}
                                    onChange={(e) => setAudit({ ...audit, auditType: e.target.value })}
                                    className="input-professional"
                                    style={{ paddingLeft: '2.8rem', marginBottom: 0, height: '48px', fontSize: '0.95rem' }}
                                >
                                    {AUDIT_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                                </select>
                                <div style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'var(--color-secondary)', padding: '0.4rem', borderRadius: '8px', color: 'white', display: 'flex', pointerEvents: 'none' }}>
                                    <Shield size={16} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Fecha Planificada *</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="date"
                                    value={audit.date}
                                    onChange={(e) => setAudit({ ...audit, date: e.target.value })}
                                    className="input-professional"
                                    style={{ paddingLeft: '2.8rem', marginBottom: 0, height: '48px', fontSize: '0.95rem' }}
                                />
                                <div style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'var(--color-accent)', padding: '0.4rem', borderRadius: '8px', color: 'white', display: 'flex', pointerEvents: 'none' }}>
                                    <Calendar size={16} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Auditor Líder *</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={audit.auditor}
                                    onChange={(e) => setAudit({ ...audit, auditor: e.target.value })}
                                    className="input-professional"
                                    style={{ paddingLeft: '2.8rem', marginBottom: 0, height: '48px', fontSize: '0.95rem' }}
                                    placeholder="Nombre del auditor"
                                />
                                <div style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'var(--color-warning)', padding: '0.4rem', borderRadius: '8px', color: 'white', display: 'flex', pointerEvents: 'none' }}>
                                    <User size={16} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Ubicación / Sector</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={audit.location}
                                    onChange={(e) => setAudit({ ...audit, location: e.target.value })}
                                    className="input-professional"
                                    style={{ paddingLeft: '2.8rem', marginBottom: 0, height: '48px', fontSize: '0.95rem' }}
                                    placeholder="Ej: Nave de Producción"
                                />
                                <div style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'var(--color-danger)', padding: '0.4rem', borderRadius: '8px', color: 'white', display: 'flex', pointerEvents: 'none' }}>
                                    <MapPin size={16} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <label style={labelStyle}>Objetivo de la Auditoría</label>
                        <textarea
                            className="input-professional"
                            value={audit.objective}
                            onChange={(e) => setAudit({ ...audit, objective: e.target.value })}
                            style={{ minHeight: '80px', paddingTop: '0.75rem', marginBottom: 0 }}
                            placeholder="Describa el propósito de esta auditoría..."
                        />
                    </div>

                    {/* Checklist ISO */}
                    <div style={{ marginTop: '3rem' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.5px' }}>
                            <ClipboardCheck size={22} /> Checklist de Cumplimiento Legal e ISO
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {audit.checklist.map((item, idx) => (
                                <div
                                    key={item.id}
                                    className="stagger-item card"
                                    style={{
                                        background: 'rgba(var(--color-surface-rgb), 0.4)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: 'var(--radius-xl)',
                                        padding: '1.5rem',
                                        boxShadow: 'var(--shadow-sm)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'all 0.25s ease'
                                    }}
                                >
                                    {/* Left Accent indicator based on compliance status */}
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: '4px',
                                        background: item.status === 'si' ? '#10b981' : item.status === 'no' ? '#ef4444' : '#64748b',
                                        transition: 'background 0.3s ease'
                                    }} />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem', flexWrap: isMobile ? 'wrap' : 'nowrap', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1, paddingLeft: '0.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: 'var(--radius-full)',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 850,
                                                    background: 'rgba(var(--color-primary-rgb), 0.1)',
                                                    color: 'var(--color-primary)',
                                                    border: '1px solid rgba(var(--color-primary-rgb), 0.2)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {item.legal}
                                                </span>

                                                {item.status === 'si' && (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem',
                                                        padding: '0.2rem 0.6rem',
                                                        borderRadius: 'var(--radius-full)',
                                                        fontSize: '0.65rem',
                                                        fontWeight: 800,
                                                        background: 'rgba(16, 185, 129, 0.1)',
                                                        color: '#10b981',
                                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        <CheckCircle2 size={12} /> Conforme
                                                    </span>
                                                )}

                                                {item.status === 'no' && (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem',
                                                        padding: '0.2rem 0.6rem',
                                                        borderRadius: 'var(--radius-full)',
                                                        fontSize: '0.65rem',
                                                        fontWeight: 800,
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        <AlertTriangle size={12} /> Desvío Detectado
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)', lineHeight: 1.4 }}>{item.question}</div>
                                        </div>

                                        {/* Segmented glows selector */}
                                        <div style={{
                                            display: 'flex',
                                            background: 'var(--color-background)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-lg)',
                                            padding: '0.25rem',
                                            gap: '0.25rem',
                                            height: 'fit-content'
                                        }}>
                                            {['si', 'no', 'na'].map(status => {
                                                const isSelected = item.status === status;
                                                const styles = getStatusStyles(status, isSelected);
                                                return (
                                                    <button
                                                        key={status}
                                                        onClick={() => {
                                                            const newChecklist = [...audit.checklist];
                                                            newChecklist[idx].status = status;
                                                            setAudit({ ...audit, checklist: newChecklist });
                                                        }}
                                                        style={{
                                                            padding: '0.45rem 1rem',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 800,
                                                            borderRadius: 'var(--radius-md)',
                                                            border: '1px solid',
                                                            borderColor: styles.borderColor,
                                                            background: styles.background,
                                                            color: styles.color,
                                                            boxShadow: styles.boxShadow,
                                                            opacity: styles.opacity,
                                                            cursor: 'pointer',
                                                            textTransform: 'uppercase',
                                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        }}
                                                    >
                                                        {status === 'si' && '✓ si'}
                                                        {status === 'no' && '✗ no'}
                                                        {status === 'na' && '• n/a'}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Observación / Hallazgo */}
                                    <div style={{ position: 'relative', marginTop: '0.5rem', paddingLeft: '0.5rem' }}>
                                        <input
                                            type="text"
                                            className="input-professional"
                                            value={item.observation}
                                            onChange={(e) => {
                                                const newChecklist = [...audit.checklist];
                                                newChecklist[idx].observation = e.target.value;
                                                setAudit({ ...audit, checklist: newChecklist });
                                            }}
                                            style={{
                                                padding: '0.65rem 0.75rem 0.65rem 2.2rem',
                                                fontSize: '0.85rem',
                                                marginBottom: 0,
                                                borderColor: item.status === 'no' && !item.observation ? 'rgba(239, 68, 68, 0.4)' : 'var(--color-border)',
                                                background: item.status === 'no' && !item.observation ? 'rgba(239, 68, 68, 0.02)' : 'var(--color-surface)'
                                            }}
                                            placeholder={item.status === 'no' ? "Describa detalladamente el hallazgo o desvío crítico..." : "Observaciones opcionales..."}
                                        />
                                        <FileText size={14} color="var(--color-text-light)" style={{ position: 'absolute', left: '1.2rem', top: '0.85rem' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reunión de Cierre */}
                    <div className="card" style={{ marginTop: '3.5rem', background: 'rgba(var(--color-primary-rgb), 0.02)', padding: '2rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--glass-border)', boxShadow: 'inset 0 0 20px rgba(var(--color-primary-rgb), 0.01)' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.5px' }}>
                            <Clock size={22} /> Minuta y Reunión de Cierre
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={labelStyle}>Participantes en el Cierre</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        value={audit.closingMeeting.participants}
                                        onChange={(e) => setAudit({ ...audit, closingMeeting: { ...audit.closingMeeting, participants: e.target.value } })}
                                        className="input-professional"
                                        style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
                                        placeholder="Nombres de los presentes"
                                    />
                                    <User size={16} color="var(--color-text-light)" style={{ position: 'absolute', left: '0.9rem', top: '1.05rem' }} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Fecha de Reunión de Cierre</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="date"
                                        value={audit.closingMeeting.date}
                                        onChange={(e) => setAudit({ ...audit, closingMeeting: { ...audit.closingMeeting, date: e.target.value } })}
                                        className="input-professional"
                                        style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
                                    />
                                    <Calendar size={16} color="var(--color-text-light)" style={{ position: 'absolute', left: '0.9rem', top: '1.05rem', pointerEvents: 'none' }} />
                                </div>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Conclusiones Generales</label>
                                <div style={{ position: 'relative' }}>
                                    <textarea
                                        value={audit.closingMeeting.conclusions}
                                        onChange={(e) => setAudit({ ...audit, closingMeeting: { ...audit.closingMeeting, conclusions: e.target.value } })}
                                        className="input-professional"
                                        style={{ minHeight: '100px', paddingLeft: '2.5rem', paddingTop: '0.75rem', marginBottom: 0 }}
                                        placeholder="Resumen de hallazgos críticos, fortalezas detectadas y cumplimiento general de la norma..."
                                    />
                                    <Award size={16} color="var(--color-text-light)" style={{ position: 'absolute', left: '0.9rem', top: '1.05rem' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Firmas y Autorizaciones */}
                    <div className="card" style={{ marginTop: '3.5rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', padding: '2rem' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            <Pencil size={22} style={{ color: 'var(--color-primary)' }} /> Firmas y Autorizaciones EHS
                        </h3>

                        {/* Custom visual switches */}
                        <div className="no-print mb-8 p-6" style={{ background: 'rgba(30, 41, 59, 0.2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ color: 'var(--color-text)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {[
                                    { id: 'operator', label: 'Persona Auditada' },
                                    { id: 'professional', label: 'Auditor Líder' },
                                    { id: 'supervisor', label: 'Supervisión / Cierre' }
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
                                                onChange={e => setShowSignatures(s => ({ ...s, [sig.id]: e.target.checked }))}
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
                                    ...audit,
                                    professionalSignature: professional.signature,
                                    professionalName: professional.name,
                                    professionalLicense: professional.license,
                                    professionalStamp: professional.stamp
                                }}
                                box1={showSignatures.operator ? {
                                    title: 'PERSONA AUDITADA / RESPONSABLE',
                                    subtitle: 'Firma de Conformidad',
                                    signatureUrl: audit.operatorSignature || null,
                                    isProfessional: false
                                } : null}
                                box2={showSignatures.professional ? {
                                    title: 'AUDITOR LÍDER / ESPECIALISTA',
                                    subtitle: (audit.auditor || professional.name || 'Firma de Especialista').toUpperCase(),
                                    signatureUrl: audit.signature || professional.signature || null,
                                    stampUrl: professional.stamp || null,
                                    isProfessional: true,
                                    license: professional.license
                                } : null}
                                box3={showSignatures.supervisor ? {
                                    title: 'SUPERVISIÓN / CIERRE',
                                    subtitle: 'Aprobación de Informe',
                                    signatureUrl: audit.supervisorSignature || null,
                                    isProfessional: false
                                } : null}
                            />
            <PdfBrandingFooter />
                        </div>

                        {/* Interactive Signature Drawing Pads */}
                        <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)]" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            {showSignatures.operator && (
                                <div style={{
                                    background: 'rgba(30, 41, 59, 0.1)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: 'var(--radius-xl)',
                                    padding: '1.25rem',
                                    boxShadow: 'var(--shadow-sm)'
                                }}>
                                    <SignatureCanvas
                                        onSave={(sig) => setAudit(prev => ({ ...prev, operatorSignature: sig || '' }))}
                                        initialImage={audit.operatorSignature}
                                        label="Firma de Persona Auditada / Responsable"
                                    />
                                </div>
                            )}

                            {showSignatures.professional && (
                                <div style={{
                                    background: 'rgba(30, 41, 59, 0.1)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: 'var(--radius-xl)',
                                    padding: '1.25rem',
                                    boxShadow: 'var(--shadow-sm)'
                                }}>
                                    <SignatureCanvas
                                        onSave={(sig) => setAudit(prev => ({ ...prev, signature: sig || '' }))}
                                        initialImage={audit.signature}
                                        label="Firma de Auditor Líder"
                                    />
                                </div>
                            )}

                            {showSignatures.supervisor && (
                                <div style={{
                                    background: 'rgba(30, 41, 59, 0.1)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: 'var(--radius-xl)',
                                    padding: '1.25rem',
                                    boxShadow: 'var(--shadow-sm)'
                                }}>
                                    <SignatureCanvas
                                        onSave={(sig) => setAudit(prev => ({ ...prev, supervisorSignature: sig || '' }))}
                                        initialImage={audit.supervisorSignature}
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
                    <Save size={18} /> GUARDAR AUDITORÍA
                </button>
            </div>

            <ShareModal
                isOpen={showShareModal}
                open={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Reporte de Auditoría"
                rawMessage={`Reporte de Auditoría: ${audit.title}`}
                text={`Reporte de Auditoría: ${audit.title}`}
                fileName={`Auditoria_${audit.title || 'Sin_Nombre'}.pdf`}
            />

            <div className="print-only" id="pdf-content" style={{ position: 'fixed', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none' }}>
                <AuditPdf data={{ ...audit, showSignatures, createdAt: audit.createdAt || new Date().toISOString() }} />
            </div>
        </div>
    );
}
