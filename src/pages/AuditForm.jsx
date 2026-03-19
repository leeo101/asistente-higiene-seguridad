import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, ClipboardCheck, Shield, AlertTriangle, Clock, CheckCircle2, User, MapPin, Calendar, FileText, Eye } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import AuditPdf from '../components/AuditPdf';

const AUDIT_TYPES = [
    { id: 'internal', name: 'Interna', icon: '📋' },
    { id: 'external', name: 'Externa', icon: '🏢' },
    { id: 'certification', name: 'Certificación', icon: '📜' },
    { id: 'surveillance', name: 'Seguimiento', icon: '👁️' }
];

export default function AuditForm() {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [audit, setAudit] = useState({
        title: '',
        auditType: 'internal',
        auditor: '',
        date: '',
        location: '',
        objective: '',
        scope: '',
        checklist: [
            { id: 1, question: '¿Cuenta con Seguro de Vida Obligatorio?', legal: 'Ley 16.600', status: 'na', observation: '' },
            { id: 2, question: '¿Se exhibe el Afiche de la ART?', legal: 'Res. SRT 70/97', status: 'na', observation: '' },
            { id: 3, question: '¿Cuenta con Registro de Entrega de EPP?', legal: 'Res. SRT 299/11', status: 'na', observation: '' },
            { id: 4, question: '¿Están señalizadas las salidas de emergencia?', legal: 'Ley 19.587 Cap 18', status: 'na', observation: '' },
            { id: 5, question: '¿Extintores con carga vigente?', legal: 'DPS 351/79', status: 'na', observation: '' }
        ],
        closingMeeting: {
            date: '',
            participants: '',
            conclusions: ''
        }
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSave = () => {
        if (!audit.title || !audit.auditor) {
            alert('Por favor complete los campos obligatorios (*)');
            return;
        }

        const newAudit = {
            ...audit,
            id: `AUD-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'planned'
        };

        const saved = JSON.parse(localStorage.getItem('ehs_audits_db') || '[]');
        const updated = [newAudit, ...saved];
        localStorage.setItem('ehs_audits_db', JSON.stringify(updated));
        
        navigate('/audit-history');
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
                        <ClipboardCheck size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Nueva Auditoría EHS
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
                    {!isMobile && 'Planificar Auditoría'}
                </button>
            </div>

            <main style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '2rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Título de la Auditoría *</label>
                            <input type="text" value={audit.title} onChange={(e) => setAudit({ ...audit, title: e.target.value })} style={inputStyle} placeholder="Ej: Auditoría Interna Trimestral - Planta Norte" />
                        </div>
                        <div>
                            <label style={labelStyle}>Tipo de Auditoría</label>
                            <select value={audit.auditType} onChange={(e) => setAudit({ ...audit, auditType: e.target.value })} style={inputStyle}>
                                {AUDIT_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Fecha Planificada *</label>
                            <input type="date" value={audit.date} onChange={(e) => setAudit({ ...audit, date: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Auditor Líder *</label>
                            <input type="text" value={audit.auditor} onChange={(e) => setAudit({ ...audit, auditor: e.target.value })} style={inputStyle} placeholder="Nombre del auditor" />
                        </div>
                        <div>
                            <label style={labelStyle}>Ubicación / Sector</label>
                            <input type="text" value={audit.location} onChange={(e) => setAudit({ ...audit, location: e.target.value })} style={inputStyle} placeholder="Ej: Nave de Producción" />
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <label style={labelStyle}>Objetivo de la Auditoría</label>
                        <textarea 
                            value={audit.objective} 
                            onChange={(e) => setAudit({ ...audit, objective: e.target.value })} 
                            style={{ ...inputStyle, minHeight: '80px', paddingTop: '0.75rem' }} 
                            placeholder="Describa el propósito de esta auditoría..."
                        />
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Checklist de Cumplimiento Legal</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {audit.checklist.map((item, idx) => (
                                <div key={item.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{item.legal}</div>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.question}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', height: 'fit-content' }}>
                                            {['si', 'no', 'na'].map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => {
                                                        const newChecklist = [...audit.checklist];
                                                        newChecklist[idx].status = status;
                                                        setAudit({ ...audit, checklist: newChecklist });
                                                    }}
                                                    style={{
                                                        padding: '0.4rem 0.8rem',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 800,
                                                        borderRadius: 'var(--radius-md)',
                                                        border: '1px solid var(--color-border)',
                                                        background: item.status === status ? 'var(--color-primary)' : 'transparent',
                                                        color: item.status === status ? 'white' : 'var(--color-text)',
                                                        cursor: 'pointer',
                                                        textTransform: 'uppercase'
                                                    }}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <input 
                                        type="text" 
                                        value={item.observation} 
                                        onChange={(e) => {
                                            const newChecklist = [...audit.checklist];
                                            newChecklist[idx].observation = e.target.value;
                                            setAudit({ ...audit, checklist: newChecklist });
                                        }} 
                                        style={{ ...inputStyle, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} 
                                        placeholder="Observaciones de hallazgo..." 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem', background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-xl)', border: '2px dashed var(--color-border)' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Reunión de Cierre</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={labelStyle}>Participantes</label>
                                <input type="text" value={audit.closingMeeting.participants} onChange={(e) => setAudit({ ...audit, closingMeeting: { ...audit.closingMeeting, participants: e.target.value } })} style={inputStyle} placeholder="Nombres de los presentes" />
                            </div>
                            <div>
                                <label style={labelStyle}>Fecha de Cierre</label>
                                <input type="date" value={audit.closingMeeting.date} onChange={(e) => setAudit({ ...audit, closingMeeting: { ...audit.closingMeeting, date: e.target.value } })} style={inputStyle} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Conclusiones Generales</label>
                                <textarea 
                                    value={audit.closingMeeting.conclusions} 
                                    onChange={(e) => setAudit({ ...audit, closingMeeting: { ...audit.closingMeeting, conclusions: e.target.value } })} 
                                    style={{ ...inputStyle, minHeight: '80px' }} 
                                    placeholder="Resumen de hallazgos críticos y cumplimiento general..." 
                                />
                            </div>
                        </div>
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
                        Planificar Auditoría
                    </button>
                </div>
            </main>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Reporte de Auditoría"
                fileName={`Auditoria_${audit.title || 'Sin_Nombre'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <AuditPdf data={{ ...audit, createdAt: audit.createdAt || new Date().toISOString() }} />
            </div>
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' };
const inputStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 500, outline: 'none', transition: 'all var(--transition-fast)', boxSizing: 'border-box' };
