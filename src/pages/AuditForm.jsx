import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, ClipboardCheck, Shield, AlertTriangle, Clock, CheckCircle2, User, MapPin, Calendar, FileText } from 'lucide-react';

const AUDIT_TYPES = [
    { id: 'internal', name: 'Interna', icon: '📋' },
    { id: 'external', name: 'Externa', icon: '🏢' },
    { id: 'certification', name: 'Certificación', icon: '📜' },
    { id: 'surveillance', name: 'Seguimiento', icon: '👁️' }
];

export default function AuditForm() {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);
    const [audit, setAudit] = useState({
        title: '',
        auditType: 'internal',
        auditor: '',
        date: '',
        location: '',
        objective: '',
        scope: '',
        sections: [
            { id: 1, title: 'Documentación', status: 'pending' },
            { id: 2, title: 'Instalaciones', status: 'pending' },
            { id: 3, title: 'Entrevistas', status: 'pending' }
        ]
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
        
        navigate('/audit');
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
                        <ClipboardCheck size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Nueva Auditoría EHS
                    </h1>
                </div>
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
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Secciones / Checklist a Evaluar</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {audit.sections.map((section) => (
                                <div
                                    key={section.id}
                                    style={{
                                        padding: '1rem',
                                        background: 'var(--color-background)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-lg)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <FileText size={18} color="var(--color-text-muted)" />
                                        <span style={{ fontWeight: 700 }}>{section.title}</span>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', padding: '0.25rem 0.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                                        {section.status}
                                    </span>
                                </div>
                            ))}
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
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' };
const inputStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 500, outline: 'none', transition: 'all var(--transition-fast)', boxSizing: 'border-box' };
