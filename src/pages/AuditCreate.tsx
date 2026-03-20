import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { XCircle, CheckCircle2 } from 'lucide-react';

// Tipos de auditoría según ISO 45001
const AUDIT_TYPES = [
    { id: 'internal', name: 'Auditoría Interna', icon: '📋', color: '#3b82f6' },
    { id: 'external', name: 'Auditoría Externa', icon: '🏢', color: '#8b5cf6' },
    { id: 'certification', name: 'Certificación', icon: '📜', color: '#10b981' },
    { id: 'surveillance', name: 'Seguimiento', icon: '👁️', color: '#f59e0b' },
    { id: 'compliance', name: 'Cumplimiento Legal', icon: '⚖️', color: '#dc2626' },
    { id: 'supplier', name: 'Proveedor', icon: '🤝', color: '#06b6d4' }
];

// Áreas de auditoría ISO 45001
const AUDIT_AREAS = [
    { id: 'context', name: 'Contexto de la Organización', clause: '4' },
    { id: 'leadership', name: 'Liderazgo y Participación', clause: '5' },
    { id: 'planning', name: 'Planificación', clause: '6' },
    { id: 'support', name: 'Apoyo', clause: '7' },
    { id: 'operation', name: 'Operación', clause: '8' },
    { id: 'performance', name: 'Evaluación del Desempeño', clause: '9' },
    { id: 'improvement', name: 'Mejora', clause: '10' }
];


export default function AuditCreate(): React.ReactElement | null {
    const navigate = useNavigate();
        const location = useLocation();
    const [audit, setAudit] = useState<any>({
        title: '',
        auditType: '',
        scope: '',
        leadAuditor: '',
        auditTeam: [],
        auditDate: '',
        duration: '',
        location: '',
        department: '',
        standard: 'ISO 45001:2018',
        areas: [],
        status: 'draft',
        scheduledDate: '',
        observations: '',
        conclusion: ''
    });

        const auditsDb = localStorage.getItem('ehs_audits_db');
    const audits = auditsDb ? JSON.parse(auditsDb) : [];

    const handleCreateAudit = () => {
        if (!audit.title.trim()) return;

        const newAudit = {
            ...audit,
            id: `AUD-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'planned',
            checklist: buildChecklist(audit.areas)
        };

        const updated = [newAudit, ...audits];
        localStorage.setItem('ehs_audits_db', JSON.stringify(updated));
        
        // Redirect back to manager with success
        navigate('/audit?created=' + newAudit.id);
    };

    const buildChecklist = (selectedAreas: string[]) => {
        const checklist: any[] = [];
        selectedAreas.forEach((areaId: string) => {
            const areaChecklist = (ISO_CHECKLIST as any)[areaId] || [];
            areaChecklist.forEach((item: any) => {
                checklist.push({
                    ...item,
                    area: areaId,
                    status: null,
                    evidence: '',
                    auditor: ''
                });
            });
        });
        return checklist;
    };

    const toggleArea = (areaId: string) => {
        const current = audit.areas || [];
        const updated = current.includes(areaId) ? current.filter((a: string) => a !== areaId) : [...current, areaId];
        setAudit({ ...audit, areas: updated });
    };

    const ISO_CHECKLIST = {
        context: [
            { id: '4.1', question: '¿Se determinaron las cuestiones internas y externas relevantes?', required: true },
            { id: '4.2', question: '¿Se identificaron las partes interesadas y sus necesidades?', required: true },
            { id: '4.3', question: '¿Está definido el alcance del SGSST?', required: true },
            { id: '4.4', question: '¿Está establecido el sistema de gestión SST?', required: true }
        ],
        leadership: [
            { id: '5.1', question: '¿La dirección demuestra liderazgo y compromiso?', required: true },
            { id: '5.2', question: '¿Existe una política de SST documentada?', required: true },
            { id: '5.3', question: '¿Están asignados roles y responsabilidades?', required: true },
            { id: '5.4', question: '¿Se consulta y participa a los trabajadores?', required: true }
        ],
        planning: [
            { id: '6.1', question: '¿Se identifican peligros y evalúan riesgos?', required: true },
            { id: '6.1.2', question: '¿Se determinan requisitos legales aplicables?', required: true },
            { id: '6.2', question: '¿Existen objetivos de SST medibles?', required: true },
            { id: '6.3', question: '¿Se planifica el cambio del sistema?', required: false }
        ],
        support: [
            { id: '7.1', question: '¿Se proporcionan recursos necesarios?', required: true },
            { id: '7.2', question: '¿El personal es competente para sus tareas?', required: true },
            { id: '7.3', question: '¿Se sensibiliza a los trabajadores sobre SST?', required: true },
            { id: '7.4', question: '¿Existen procesos de comunicación interna/externa?', required: true },
            { id: '7.5', question: '¿Se controla la información documentada?', required: true }
        ],
        operation: [
            { id: '8.1', question: '¿Se planifican y controlan los procesos operacionales?', required: true },
            { id: '8.1.1', question: '¿Existe jerarquía de controles de riesgo?', required: true },
            { id: '8.1.2', question: '¿Se gestiona el cambio operacional?', required: true },
            { id: '8.1.3', question: '¿Se gestionan compras y contratistas?', required: true },
            { id: '8.1.4', question: '¿Existe preparación y respuesta ante emergencias?', required: true }
        ],
        performance: [
            { id: '9.1', question: '¿Se realiza seguimiento y medición del desempeño?', required: true },
            { id: '9.1.2', question: '¿Se evalúa el cumplimiento legal?', required: true },
            { id: '9.2', question: '¿Se realiza auditoría interna periódica?', required: true },
            { id: '9.3', question: '¿La dirección revisa el sistema anualmente?', required: true }
        ],
        improvement: [
            { id: '10.1', question: '¿Se investigan incidentes y no conformidades?', required: true },
            { id: '10.2', question: '¿Se toman acciones correctivas?', required: true },
            { id: '10.3', question: '¿Existe mejora continua del sistema?', required: true }
        ]
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem', maxWidth: '900px', paddingTop: '2rem' }}>
            {/* Header */}
            <div style={{
                marginBottom: '2.5rem',
                padding: '1.75rem',
                background: 'var(--gradient-card)',
                borderRadius: 'var(--radius-2xl)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
                    }}>
                        <XCircle size={32} color="#ffffff" strokeWidth={2} onClick={() => navigate('/audit')} style={{ cursor: 'pointer' }} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.2 }}>Nueva Auditoría EHS</h1>
                        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.4 }}>Completá los datos para crear una auditoría</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="card" style={{ padding: '2.5rem', paddingTop: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div><label style={labelStyle}>Título *</label><input type="text" value={audit.title} onChange={(e) => setAudit({ ...audit, title: e.target.value })} style={inputStyle} placeholder="Ej: Auditoría Interna 2024" /></div>
                    <div><label style={labelStyle}>Tipo de Auditoría</label><select value={audit.auditType} onChange={(e) => setAudit({ ...audit, auditType: e.target.value })} style={inputStyle}>{AUDIT_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}</select></div>
                    <div><label style={labelStyle}>Auditor Líder</label><input type="text" value={audit.leadAuditor} onChange={(e) => setAudit({ ...audit, leadAuditor: e.target.value })} style={inputStyle} placeholder="Nombre del auditor" /></div>
                    <div><label style={labelStyle}>Ubicación</label><input type="text" value={audit.location} onChange={(e) => setAudit({ ...audit, location: e.target.value })} style={inputStyle} placeholder="Ej: Planta Principal" /></div>
                    <div><label style={labelStyle}>Fecha Programada</label><input type="date" value={audit.scheduledDate} onChange={(e) => setAudit({ ...audit, scheduledDate: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Duración (días)</label><input type="number" value={audit.duration} onChange={(e) => setAudit({ ...audit, duration: e.target.value })} style={inputStyle} placeholder="Ej: 2" /></div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={labelStyle}>Áreas ISO 45001 a Auditar</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                        {AUDIT_AREAS.map(area => (
                            <label key={area.clause} style={{
                                padding: '1rem',
                                background: audit.areas?.includes(area.id) ? '#eff6ff' : 'var(--color-background)',
                                border: `2px solid ${audit.areas?.includes(area.id) ? '#3b82f6' : 'var(--color-border)'}`,
                                borderRadius: 'var(--radius-lg)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                transition: 'all var(--transition-fast)'
                            }}>
                                <input type="checkbox" checked={audit.areas?.includes(area.id)} onChange={() => toggleArea(area.id)} style={{ width: '20px', height: '20px' }} />
                                <div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Cláusula {area.clause}</span>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{area.name}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                    <button onClick={() => navigate('/audit')} style={{ flex: 1, padding: '1rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>Cancelar</button>
                    <button onClick={handleCreateAudit} className="btn-primary" style={{ flex: 1, fontSize: '1rem' }}>Crear Auditoría</button>
                </div>
            </div>
        </div>
    );
}

const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    marginBottom: '0.5rem'
};

const inputStyle: React.CSSProperties = {
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
    boxSizing: 'border-box'
};
