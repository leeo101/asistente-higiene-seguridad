import React from 'react';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { 
    ClipboardCheck, Plus, Search, 
    FileText, Eye, Edit3, Trash2, CheckCircle2, 
    XCircle, Clock, User, Users, Calendar,
    Shield, TrendingUp, AlertTriangle, BarChart3,
    Activity, CheckSquare, XSquare, Star, Target
} from 'lucide-react';

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

// Estados de auditoría
const AUDIT_STATUS = {
    draft: { label: 'BORRADOR', color: '#6b7280', bg: '#f3f4f6' },
    planned: { label: 'PLANIFICADA', color: '#3b82f6', bg: '#eff6ff' },
    in_progress: { label: 'EN CURSO', color: '#f59e0b', bg: '#fffbeb' },
    completed: { label: 'COMPLETADA', color: '#16a34a', bg: '#f0fdf4' },
    cancelled: { label: 'CANCELADA', color: '#dc2626', bg: '#fef2f2' }
};

// Estados de hallazgos
const FINDING_STATUS = {
    open: { label: 'ABIERTO', color: '#dc2626', bg: '#fef2f2' },
    in_progress: { label: 'EN PROGRESO', color: '#f59e0b', bg: '#fffbeb' },
    closed: { label: 'CERRADO', color: '#16a34a', bg: '#f0fdf4' },
    verified: { label: 'VERIFICADO', color: '#3b82f6', bg: '#eff6ff' }
};

// Severidad de hallazgos
const FINDING_SEVERITY = {
    critical: { label: 'CRÍTICO', color: '#dc2626', icon: '🔴' },
    major: { label: 'MAYOR', color: '#f59e0b', icon: '🟠' },
    minor: { label: 'MENOR', color: '#eab308', icon: '🟡' },
    observation: { label: 'OBSERVACIÓN', color: '#3b82f6', icon: '🔵' },
    opportunity: { label: 'OPORTUNIDAD', color: '#10b981', icon: '🟢' }
};

// Checklist base ISO 45001
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

export default function AuditManager(): React.ReactElement | null {
        const [audits, setAudits] = useState([]);
    const [findings, setFindings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [activeTab, setActiveTab] = useState('audits');

    const [newAudit, setNewAudit] = useState({
        id: '',
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
        checklist: [],
        status: 'draft',
        createdAt: '',
        scheduledDate: '',
        completedDate: '',
        observations: '',
        conclusion: ''
    });

    useEffect(() => {
        const savedAudits = localStorage.getItem('ehs_audits_db');
        const savedFindings = localStorage.getItem('ehs_audit_findings_db');
        if (savedAudits) setAudits(JSON.parse(savedAudits));
        if (savedFindings) setFindings(JSON.parse(savedFindings));
    }, []);

    const saveAudits = (data) => {
        localStorage.setItem('ehs_audits_db', JSON.stringify(data));
        setAudits(data);
    };

    const saveFindings = (data) => {
        localStorage.setItem('ehs_audit_findings_db', JSON.stringify(data));
        setFindings(data);
    };

    const handleCreateAudit = () => {
        if (!newAudit.title.trim()) return;

        const audit = {
            ...newAudit,
            id: `AUD-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'planned',
            checklist: buildChecklist(newAudit.areas)
        };

        const updated = [audit, ...audits];
        saveAudits(updated);
        navigate('/audit?created=' + audit.id);
        resetForm();
    };

    const buildChecklist = (selectedAreas) => {
        const checklist = [];
        selectedAreas.forEach(areaId => {
            const areaChecklist = ISO_CHECKLIST[areaId] || [];
            areaChecklist.forEach(item => {
                checklist.push({
                    ...item,
                    area: areaId,
                    status: null, // null, conforming, nonconforming, notApplicable
                    evidence: '',
                    auditor: ''
                });
            });
        });
        return checklist;
    };

    const resetForm = () => {
        setNewAudit({
            id: '',
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
            checklist: [],
            status: 'draft',
            createdAt: '',
            scheduledDate: '',
            completedDate: '',
            observations: '',
            conclusion: ''
        });
    };

    const startAudit = (auditId) => {
        const updated = audits.map(a => 
            a.id === auditId ? { ...a, status: 'in_progress' } : a
        );
        saveAudits(updated);
    };

    const completeAudit = (auditId) => {
        const updated = audits.map(a => 
            a.id === auditId ? { 
                ...a, 
                status: 'completed',
                completedDate: new Date().toISOString()
            } : a
        );
        saveAudits(updated);
    };

    const deleteAudit = (id) => {
        if (confirm('¿Eliminar esta auditoría?')) {
            saveAudits(audits.filter(a => a.id !== id));
            saveFindings(findings.filter(f => f.auditId !== id));
        }
    };

    const addFinding = (finding) => {
        const newFinding = {
            ...finding,
            id: `FIND-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'open'
        };
        const updated = [newFinding, ...findings];
        saveFindings(updated);
        return newFinding;
    };

    const updateFindingStatus = (findingId, status) => {
        const updated = findings.map(f => 
            f.id === findingId ? { ...f, status } : f
        );
        saveFindings(updated);
    };

    const filteredAudits = audits.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            a.leadAuditor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            a.location?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Estadísticas
    const stats = {
        total: audits.length,
        inProgress: audits.filter(a => a.status === 'in_progress').length,
        completed: audits.filter(a => a.status === 'completed').length,
        findings: findings.length,
        openFindings: findings.filter(f => f.status === 'open').length,
        criticalFindings: findings.filter(f => f.severity === 'critical').length,
        complianceRate: audits.length > 0 
            ? Math.round((audits.filter(a => a.status === 'completed').length / audits.length) * 100)
            : 0
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            {/* Header Premium */}
            <div style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'var(--gradient-card)',
                borderRadius: 'var(--radius-2xl)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
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
                        <ClipboardCheck size={32} color="#ffffff" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 style={{ 
                            margin: 0, 
                            fontSize: '1.5rem', 
                            fontWeight: 900,
                            color: 'var(--color-text)',
                            letterSpacing: '-0.5px'
                        }}>
                            Auditorías EHS
                        </h1>
                        <p style={{ 
                            margin: '0.25rem 0 0 0', 
                            color: 'var(--color-text-muted)',
                            fontSize: '0.85rem',
                            fontWeight: 600
                        }}>
                            ISO 45001 • {stats.inProgress} en curso
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate('/audit/new')}
                        className="btn-primary"
                        style={{
                            width: 'auto',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.25rem'
                        }}
                    >
                        <Plus size={20} strokeWidth={2.5} />
                        Nueva Auditoría
                    </button>
                    <button
                        onClick={() => navigate('/audit-reports')}
                        className="btn-outline"
                        style={{
                            padding: '0.75rem 1rem'
                        }}
                    >
                        <FileText size={20} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <StatCard 
                    icon={<FileText size={24} />}
                    label="Total Auditorías"
                    value={stats.total}
                    color="#3B82F6"
                    gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)"
                />
                <StatCard 
                    icon={<Clock size={24} />}
                    label="En Curso"
                    value={stats.inProgress}
                    color="#f59e0b"
                    gradient="linear-gradient(135deg, #f59e0b, #d97706)"
                />
                <StatCard 
                    icon={<CheckCircle2 size={24} />}
                    label="Completadas"
                    value={stats.completed}
                    color="#16a34a"
                    gradient="linear-gradient(135deg, #16a34a, #059669)"
                />
                <StatCard 
                    icon={<AlertTriangle size={24} />}
                    label="Hallazgos Abiertos"
                    value={stats.openFindings}
                    color="#dc2626"
                    gradient="linear-gradient(135deg, #dc2626, #991b1b)"
                />
            </div>

            {/* Secondary Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Tasa de Cumplimiento</span>
                        <Target size={20} color="#8b5cf6" />
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#8b5cf6' }}>
                        {stats.complianceRate}%
                    </div>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', marginTop: '0.75rem', overflow: 'hidden' }}>
                        <div style={{ width: `${stats.complianceRate}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)', borderRadius: '4px' }} />
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Total Hallazgos</span>
                        <AlertTriangle size={20} color="#f59e0b" />
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f59e0b' }}>
                        {stats.findings}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                        {stats.criticalFindings} críticos
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1.5rem',
                borderBottom: '2px solid var(--color-border)',
                paddingBottom: '0.5rem'
            }}>
                <TabButton 
                    active={activeTab === 'audits'}
                    onClick={() => setActiveTab('audits')}
                    icon={<ClipboardCheck size={18} />}
                    label="Auditorías"
                    count={audits.length}
                />
                <TabButton 
                    active={activeTab === 'findings'}
                    onClick={() => setActiveTab('findings')}
                    icon={<AlertTriangle size={18} />}
                    label="Hallazgos"
                    count={findings.length}
                    badge={stats.openFindings}
                />
                <TabButton 
                    active={activeTab === 'checklist'}
                    onClick={() => setActiveTab('checklist')}
                    icon={<CheckSquare size={18} />}
                    label="Checklist ISO"
                />
            </div>

            {/* Content by Tab */}
            {activeTab === 'audits' && (
                <>
                    {/* Search & Filters */}
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                            <Search 
                                size={20} 
                                color="var(--color-text-muted)"
                                style={{
                                    position: 'absolute',
                                    left: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none'
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Buscar por título, auditor, ubicación..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.85rem 1rem 0.85rem 3rem',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--color-input-border)',
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text)',
                                    fontSize: '0.95rem',
                                    fontWeight: 500,
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{
                                padding: '0.85rem 1.25rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-input-border)',
                                background: 'var(--color-surface)',
                                color: 'var(--color-text)',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">Todos los Estados</option>
                            {Object.entries(AUDIT_STATUS).map(([key, value]) => (
                                <option key={key} value={key}>{value.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Audits List */}
                    {filteredAudits.length === 0 ? (
                        <EmptyState onAdd={() => navigate('/audit/new')} />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filteredAudits.map(audit => (
                                <AuditCard
                                    key={audit.id}
                                    audit={audit}
                                    statusConfig={AUDIT_STATUS[audit.status] || AUDIT_STATUS.draft}
                                    onStart={() => startAudit(audit.id)}
                                    onComplete={() => completeAudit(audit.id)}
                                    onView={() => navigate(`/audit/${audit.id}`)}
                                    onAddFinding={() => navigate(`/audit/${audit.id}/finding`)}
                                    onDelete={() => deleteAudit(audit.id)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'findings' && (
                <FindingsList 
                    findings={findings}
                    audits={audits}
                    onUpdateStatus={updateFindingStatus}
                    severityConfig={FINDING_SEVERITY}
                    statusConfig={FINDING_STATUS}
                />
            )}

            {activeTab === 'checklist' && (
                <ISOChecklistPanel 
                    checklist={ISO_CHECKLIST}
                    areas={AUDIT_AREAS}
                />
            )}
        </div>
    );
}

// Componentes Auxiliares
function StatCard({ icon, label, value, color, gradient }) {
    return (
        <div className="card" style={{
            padding: '1.25rem',
            background: 'var(--gradient-card)',
            border: '1px solid var(--glass-border-subtle)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '80px',
                height: '80px',
                background: gradient,
                borderRadius: '50%',
                opacity: 0.1
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    background: gradient,
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 15px ${color}40`
                }}>
                    {React.cloneElement(icon, { color: '#ffffff', size: 24 })}
                </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>
                {value}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                {label}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label, count, badge }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                background: active ? 'var(--color-primary)' : 'transparent',
                color: active ? '#fff' : 'var(--color-text-muted)',
                border: 'none',
                borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                transition: 'all var(--transition-fast)',
                position: 'relative'
            }}
        >
            {icon}
            {label}
            {count !== undefined && (
                <span style={{
                    padding: '0.2rem 0.5rem',
                    background: active ? 'rgba(255,255,255,0.2)' : 'var(--color-background)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 800
                }}>
                    {count}
                </span>
            )}
            {badge > 0 && (
                <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '20px',
                    height: '20px',
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 900
                }}>
                    {badge}
                </span>
            )}
        </button>
    );
}

function AuditCard({ audit, statusConfig, onStart, onComplete, onView, onAddFinding, onDelete }) {
    const auditType = AUDIT_TYPES.find(t => t.id === audit.auditType);
    const auditFindings = findings.filter(f => f.auditId === audit.id);
    const openFindings = auditFindings.filter(f => f.status === 'open').length;

    return (
        <div className="card" style={{
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'all var(--transition-fast)',
            borderLeft: `4px solid ${statusConfig.color}`
        }}>
            {/* Icono */}
            <div style={{
                width: '56px',
                height: '56px',
                background: `${statusConfig.color}15`,
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                <ClipboardCheck size={28} color={statusConfig.color} strokeWidth={2.5} />
            </div>

            {/* Información */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ 
                        margin: 0, 
                        fontSize: '1.1rem', 
                        fontWeight: 800,
                        color: 'var(--color-text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {auditType?.icon} {audit.title}
                    </h3>
                    <span style={{
                        padding: '0.35rem 0.75rem',
                        background: statusConfig.bg,
                        color: statusConfig.color,
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        flexShrink: 0
                    }}>
                        {statusConfig.label}
                    </span>
                </div>
                <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '1rem',
                    fontSize: '0.85rem',
                    color: 'var(--color-text-muted)',
                    fontWeight: 500
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <User size={14} />
                        {audit.leadAuditor || 'Sin auditor'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={14} />
                        {audit.scheduledDate ? new Date(audit.scheduledDate).toLocaleDateString() : '-'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Shield size={14} />
                        {audit.standard}
                    </span>
                    {openFindings > 0 && (
                        <span style={{
                            padding: '0.25rem 0.5rem',
                            background: '#fef2f2',
                            color: '#dc2626',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.7rem',
                            fontWeight: 700
                        }}>
                            <AlertTriangle size={12} style={{ display: 'inline', marginRight: '2px' }} />
                            {openFindings} hallazgos abiertos
                        </span>
                    )}
                </div>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {audit.status === 'planned' && (
                    <button
                        onClick={onStart}
                        style={{
                            padding: '0.6rem 0.75rem',
                            background: '#3b82f6',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            transition: 'all var(--transition-fast)'
                        }}
                        title="Iniciar Auditoría"
                    >
                        <Clock size={18} />
                    </button>
                )}
                {audit.status === 'in_progress' && (
                    <>
                        <button
                            onClick={onAddFinding}
                            style={{
                                padding: '0.6rem 0.75rem',
                                background: '#f59e0b',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                transition: 'all var(--transition-fast)'
                            }}
                            title="Agregar Hallazgo"
                        >
                            <AlertTriangle size={18} />
                        </button>
                        <button
                            onClick={onComplete}
                            style={{
                                padding: '0.6rem 0.75rem',
                                background: '#16a34a',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                transition: 'all var(--transition-fast)'
                            }}
                            title="Completar Auditoría"
                        >
                            <CheckCircle2 size={18} />
                        </button>
                    </>
                )}
                <button
                    onClick={onView}
                    style={{
                        padding: '0.6rem 0.75rem',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: 'var(--color-primary)',
                        transition: 'all var(--transition-fast)'
                    }}
                    title="Ver detalle"
                >
                    <Eye size={18} />
                </button>
                <button
                    onClick={onDelete}
                    style={{
                        padding: '0.6rem 0.75rem',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: '#ef4444',
                        transition: 'all var(--transition-fast)'
                    }}
                    title="Eliminar"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}

function EmptyState({ onAdd }) {
    return (
        <div style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            background: 'var(--gradient-card)',
            borderRadius: 'var(--radius-2xl)',
            border: '2px dashed var(--color-border)'
        }}>
            <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 1.5rem',
                background: 'var(--color-background)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <ClipboardCheck size={40} color="var(--color-text-muted)" />
            </div>
            <h3 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '1.25rem', 
                fontWeight: 800,
                color: 'var(--color-text)'
            }}>
                Sin Auditorías
            </h3>
            <p style={{ 
                margin: '0 0 1.5rem 0', 
                color: 'var(--color-text-muted)',
                fontSize: '0.95rem'
            }}>
                Creá auditorías EHS según ISO 45001:2018
            </p>
            <button
                onClick={onAdd}
                className="btn-primary"
                style={{ width: 'auto', margin: 0 }}
            >
                <Plus size={20} style={{ marginRight: '0.5rem' }} />
                Primera Auditoría
            </button>
        </div>
    );
}

// ... más componentes (FindingsList, CreateAuditModal, AuditDetailModal, etc.)

const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    marginBottom: '0.5rem'
};

const inputStyle = {
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

// Componentes restantes simplificados por espacio
function FindingsList({ findings, audits, onUpdateStatus, severityConfig, statusConfig }) {
    if (findings.length === 0) {
        return (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--gradient-card)', borderRadius: 'var(--radius-2xl)', border: '2px dashed var(--color-border)' }}>
                <CheckCircle2 size={48} color="#16a34a" style={{ marginBottom: '1rem' }} />
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800 }}>¡Sin Hallazgos!</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>No hay hallazgos registrados en las auditorías.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {findings.map(finding => {
                const audit = audits.find(a => a.id === finding.auditId);
                const severity = severityConfig[finding.severity] || severityConfig.observation;
                const status = statusConfig[finding.status] || statusConfig.open;
                
                return (
                    <div key={finding.id} className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${severity.color}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '2rem' }}>{severity.icon}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{finding.title}</h4>
                                    <span style={{ padding: '0.25rem 0.5rem', background: severity.bg, color: severity.color, borderRadius: 'var(--radius-full)', fontSize: '0.65rem', fontWeight: 800 }}>{severity.label}</span>
                                    <span style={{ padding: '0.25rem 0.5rem', background: status.bg, color: status.color, borderRadius: 'var(--radius-full)', fontSize: '0.65rem', fontWeight: 800 }}>{status.label}</span>
                                </div>
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{finding.description}</p>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    <span>Auditoría: {audit?.title || 'N/A'}</span>
                                    <span>Fecha: {new Date(finding.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <select 
                                value={finding.status} 
                                onChange={(e) => onUpdateStatus(finding.id, e.target.value)}
                                style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.8rem', fontWeight: 600 }}
                            >
                                {Object.entries(statusConfig).map(([key, value]) => (
                                    <option key={key} value={key}>{value.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ISOChecklistPanel({ checklist, areas }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {AUDIT_AREAS.map(area => (
                <div key={area.id} className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={18} color="#8b5cf6" />Cláusula {area.clause}: {area.name}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {checklist[area.id]?.map(item => (
                            <div key={item.id} style={{ padding: '0.75rem', background: item.required ? '#f8fafc' : 'var(--color-background)', border: `1px solid ${item.required ? '#e2e8f0' : 'var(--color-border)'}`, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', minWidth: '30px' }}>{item.id}</span>
                                <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>{item.question}</span>
                                {item.required && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#dc2626', padding: '0.2rem 0.5rem', background: '#fef2f2', borderRadius: 'var(--radius-full)' }}>REQUERIDO</span>}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
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
