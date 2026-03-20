import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { XCircle, ClipboardCheck, AlertTriangle, Clock, CheckCircle2, Shield } from 'lucide-react';

const AUDIT_TYPES = [
    { id: 'internal', name: 'Auditoría Interna', icon: '📋', color: '#3b82f6' },
    { id: 'external', name: 'Auditoría Externa', icon: '🏢', color: '#8b5cf6' },
    { id: 'certification', name: 'Certificación', icon: '📜', color: '#10b981' },
    { id: 'surveillance', name: 'Seguimiento', icon: '👁️', color: '#f59e0b' },
    { id: 'compliance', name: 'Cumplimiento Legal', icon: '⚖️', color: '#dc2626' },
    { id: 'supplier', name: 'Proveedor', icon: '🤝', color: '#06b6d4' }
];

const AUDIT_STATUS = {
    draft: { label: 'BORRADOR', color: '#6b7280', bg: '#f3f4f6' },
    planned: { label: 'PLANIFICADA', color: '#3b82f6', bg: '#eff6ff' },
    in_progress: { label: 'EN CURSO', color: '#f59e0b', bg: '#fffbeb' },
    completed: { label: 'COMPLETADA', color: '#16a34a', bg: '#f0fdf4' },
    cancelled: { label: 'CANCELADA', color: '#dc2626', bg: '#fef2f2' }
};

const FINDING_SEVERITY = {
    critical: { label: 'CRÍTICO', color: '#dc2626', icon: '🔴' },
    major: { label: 'MAYOR', color: '#f59e0b', icon: '🟠' },
    minor: { label: 'MENOR', color: '#eab308', icon: '🟡' },
    observation: { label: 'OBSERVACIÓN', color: '#3b82f6', icon: '🔵' },
    opportunity: { label: 'OPORTUNIDAD', color: '#10b981', icon: '🟢' }
};

export default function AuditDetail(): React.ReactElement | null {
        const { id } = useParams();
    const [audit, setAudit] = useState(null);
    const [findings, setFindings] = useState([]);
    const [showFindingForm, setShowFindingForm] = useState(false);
    const [newFinding, setNewFinding] = useState({ title: '', description: '', severity: 'minor', responsible: '', dueDate: '' });

    useEffect(() => {
        const auditsDb = localStorage.getItem('ehs_audits_db');
        const findingsDb = localStorage.getItem('ehs_audit_findings_db');
        
        if (auditsDb) {
            const audits = JSON.parse(auditsDb);
            const found = audits.find(a => a.id === id);
            if (found) setAudit(found);
        }
        
        if (findingsDb) {
            const allFindings = JSON.parse(findingsDb);
            const auditFindings = allFindings.filter(f => f.auditId === id);
            setFindings(auditFindings);
        }
    }, [id]);

    const handleAddFinding = () => {
        if (!newFinding.title.trim()) return;
        
        const finding = {
            ...newFinding,
            id: `FIND-${Date.now()}`,
            auditId: id,
            createdAt: new Date().toISOString(),
            status: 'open'
        };
        
        const updated = [finding, ...findings];
        localStorage.setItem('ehs_audit_findings_db', JSON.stringify(updated));
        setFindings(updated);
        setShowFindingForm(false);
        setNewFinding({ title: '', description: '', severity: 'minor', responsible: '', dueDate: '' });
    };

    const updateAuditStatus = (status) => {
        const auditsDb = localStorage.getItem('ehs_audits_db');
        if (!auditsDb || !audit) return;
        
        const audits = JSON.parse(auditsDb);
        const updated = audits.map(a => 
            a.id === id ? { ...a, status } : a
        );
        localStorage.setItem('ehs_audits_db', JSON.stringify(updated));
        setAudit({ ...audit, status });
    };

    if (!audit) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <h2>Cargando...</h2>
            </div>
        );
    }

    const auditType = AUDIT_TYPES.find(t => t.id === audit.auditType);
    const statusConfig = AUDIT_STATUS[audit.status] || AUDIT_STATUS.draft;
    const completedChecklist = audit.checklist?.filter(c => c.status !== null).length || 0;
    const totalChecklist = audit.checklist?.length || 0;
    const progress = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

    return (
        <div className="container" style={{ paddingBottom: '6rem', maxWidth: '900px' }}>
            {/* Header */}
            <div style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                background: `${statusConfig.bg}`,
                borderBottom: `2px solid ${statusConfig.color}`,
                borderRadius: 'var(--radius-2xl)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/audit')} style={{
                        padding: '0.5rem',
                        background: 'var(--color-background)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <XCircle size={24} />
                    </button>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: `linear-gradient(135deg, ${statusConfig.color}, ${statusConfig.color}cc)`,
                        borderRadius: 'var(--radius-xl)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff'
                    }}>
                        <ClipboardCheck size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>{auditType?.icon} {audit.title}</h2>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{audit.location || 'Sin ubicación'} • <span style={{ color: statusConfig.color, fontWeight: 800 }}>{statusConfig.label}</span></p>
                    </div>
                </div>
            </div>

            {/* Progreso */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase' }}>Progreso de Auditoría</h3>
                <div style={{ padding: '1rem', background: 'var(--color-background)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Checklist: {completedChecklist}/{totalChecklist} items</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-primary)' }}>{progress}%</span>
                    </div>
                    <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)', borderRadius: '5px' }} />
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase' }}>Información</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <InfoDetail label="Tipo" value={auditType?.name || '-'} />
                    <InfoDetail label="Norma" value={audit.standard || '-'} />
                    <InfoDetail label="Auditor Líder" value={audit.leadAuditor || '-'} />
                    <InfoDetail label="Fecha" value={audit.scheduledDate ? new Date(audit.scheduledDate).toLocaleDateString() : '-'} />
                    <InfoDetail label="Duración" value={audit.duration ? `${audit.duration} días` : '-'} />
                    <InfoDetail label="Departamento" value={audit.department || '-'} />
                </div>
            </div>

            {/* Hallazgos */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Hallazgos ({findings.length})</h3>
                    <button onClick={() => setShowFindingForm(!showFindingForm)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        <AlertTriangle size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                        Agregar
                    </button>
                </div>

                {showFindingForm && (
                    <div style={{ padding: '1.5rem', background: 'var(--color-background)', borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>Nuevo Hallazgo</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div><label style={labelStyle}>Título *</label><input type="text" value={newFinding.title} onChange={(e) => setNewFinding({ ...newFinding, title: e.target.value })} style={inputStyle} placeholder="Descripción breve" /></div>
                            <div><label style={labelStyle}>Severidad</label><select value={newFinding.severity} onChange={(e) => setNewFinding({ ...newFinding, severity: e.target.value })} style={inputStyle}>{Object.entries(FINDING_SEVERITY).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}</select></div>
                        </div>
                        <div style={{ marginBottom: '1rem' }}><label style={labelStyle}>Descripción *</label><textarea value={newFinding.description} onChange={(e) => setNewFinding({ ...newFinding, description: e.target.value })} style={{ ...inputStyle, minHeight: '80px' }} placeholder="Descripción detallada" /></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div><label style={labelStyle}>Responsable</label><input type="text" value={newFinding.responsible} onChange={(e) => setNewFinding({ ...newFinding, responsible: e.target.value })} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Fecha Límite</label><input type="date" value={newFinding.dueDate} onChange={(e) => setNewFinding({ ...newFinding, dueDate: e.target.value })} style={inputStyle} /></div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setShowFindingForm(false)} style={{ flex: 1, padding: '0.75rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={handleAddFinding} className="btn-primary" style={{ flex: 1 }}>Guardar</button>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {findings.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>No hay hallazgos registrados</p>
                    ) : (
                        findings.map((f, i) => (
                            <div key={i} style={{ padding: '1rem', background: f.status === 'open' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${f.status === 'open' ? '#fecaca' : '#16a34a'}`, borderRadius: 'var(--radius-lg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{FINDING_SEVERITY[f.severity]?.icon} {f.title}</span>
                                    <span style={{ padding: '0.25rem 0.75rem', background: f.status === 'open' ? '#dc2626' : '#16a34a', color: '#fff', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 800 }}>{f.status.toUpperCase()}</span>
                                </div>
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{f.description}</p>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Responsable: {f.responsible || 'N/A'} • Vence: {f.dueDate ? new Date(f.dueDate).toLocaleDateString() : 'N/A'}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Acciones de Estado */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase' }}>Acciones</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {audit.status === 'draft' && <button onClick={() => updateAuditStatus('planned')} className="btn-primary" style={{ flex: 'auto', margin: 0 }}>Planificar</button>}
                    {audit.status === 'planned' && <button onClick={() => updateAuditStatus('in_progress')} className="btn-primary" style={{ flex: 'auto', margin: 0, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>Iniciar</button>}
                    {audit.status === 'in_progress' && <button onClick={() => updateAuditStatus('completed')} className="btn-primary" style={{ flex: 'auto', margin: 0, background: 'linear-gradient(135deg, #16a34a, #059669)' }}>Completar</button>}
                    {audit.status === 'completed' && <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Auditoría Completada</span>}
                </div>
            </div>
        </div>
    );
}


function InfoDetail({ label, value }) {
    return (
        <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)' }}>{value}</div>
        </div>
    );
}
