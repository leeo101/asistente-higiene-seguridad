import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck, Plus, Search,
  FileText, Eye, Edit3, Trash2, CheckCircle2,
  XCircle, Clock, User, Calendar,
  Shield, TrendingUp, AlertTriangle, BarChart3,
  Activity, CheckSquare, XSquare, Star, Target, Share2, ArrowLeft } from
'lucide-react';
import ShareModal from '../components/ShareModal';
import AuditPdf from '../components/AuditPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import ConfirmModal from '../components/ConfirmModal';

// Tipos de auditoría según ISO 45001
const AUDIT_TYPES = [
{ id: 'internal', name: 'Auditoría Interna', icon: '📋', color: '#3b82f6' },
{ id: 'external', name: 'Auditoría Externa', icon: '🏢', color: '#8b5cf6' },
{ id: 'certification', name: 'Certificación', icon: '📜', color: '#10b981' },
{ id: 'surveillance', name: 'Seguimiento', icon: '👁️', color: '#f59e0b' },
{ id: 'compliance', name: 'Cumplimiento Legal', icon: '⚖️', color: '#dc2626' },
{ id: 'supplier', name: 'Proveedor', icon: '🤝', color: '#06b6d4' }];


// Áreas de auditoría ISO 45001
const AUDIT_AREAS = [
{ id: 'context', name: 'Contexto de la Organización', clause: '4' },
{ id: 'leadership', name: 'Liderazgo y Participación', clause: '5' },
{ id: 'planning', name: 'Planificación', clause: '6' },
{ id: 'support', name: 'Apoyo', clause: '7' },
{ id: 'operation', name: 'Operación', clause: '8' },
{ id: 'performance', name: 'Evaluación del Desempeño', clause: '9' },
{ id: 'improvement', name: 'Mejora', clause: '10' }];


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
  { id: '4.4', question: '¿Está establecido el sistema de gestión SST?', required: true }],

  leadership: [
  { id: '5.1', question: '¿La dirección demuestra liderazgo y compromiso?', required: true },
  { id: '5.2', question: '¿Existe una política de SST documentada?', required: true },
  { id: '5.3', question: '¿Están asignados roles y responsabilidades?', required: true },
  { id: '5.4', question: '¿Se consulta y participa a los trabajadores?', required: true }],

  planning: [
  { id: '6.1', question: '¿Se identifican peligros y evalúan riesgos?', required: true },
  { id: '6.1.2', question: '¿Se determinan requisitos legales aplicables?', required: true },
  { id: '6.2', question: '¿Existen objetivos de SST medibles?', required: true },
  { id: '6.3', question: '¿Se planifica el cambio del sistema?', required: false }],

  support: [
  { id: '7.1', question: '¿Se proporcionan recursos necesarios?', required: true },
  { id: '7.2', question: '¿El personal es competente para sus tareas?', required: true },
  { id: '7.3', question: '¿Se sensibiliza a los trabajadores sobre SST?', required: true },
  { id: '7.4', question: '¿Existen procesos de comunicación interna/externa?', required: true },
  { id: '7.5', question: '¿Se controla la información documentada?', required: true }],

  operation: [
  { id: '8.1', question: '¿Se planifican y controlan los procesos operacionales?', required: true },
  { id: '8.1.1', question: '¿Existe jerarquía de controles de riesgo?', required: true },
  { id: '8.1.2', question: '¿Se gestiona el cambio operacional?', required: true },
  { id: '8.1.3', question: '¿Se gestionan compras y contratistas?', required: true },
  { id: '8.1.4', question: '¿Existe preparación y respuesta ante emergencias?', required: true }],

  performance: [
  { id: '9.1', question: '¿Se realiza seguimiento y medición del desempeño?', required: true },
  { id: '9.1.2', question: '¿Se evalúa el cumplimiento legal?', required: true },
  { id: '9.2', question: '¿Se realiza auditoría interna periódica?', required: true },
  { id: '9.3', question: '¿La dirección revisa el sistema anualmente?', required: true }],

  improvement: [
  { id: '10.1', question: '¿Se investigan incidentes y no conformidades?', required: true },
  { id: '10.2', question: '¿Se toman acciones correctivas?', required: true },
  { id: '10.3', question: '¿Existe mejora continua del sistema?', required: true }]

};

export default function AuditManager(): React.ReactElement | null {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('audits');
  const [showFindingModal, setShowFindingModal] = useState(false);
  const [currentAuditForFinding, setCurrentAuditForFinding] = useState(null);
  const [shareItem, setShareItem] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const saveAudits = (data: any) => {
    localStorage.setItem('ehs_audits_db', JSON.stringify(data));
    setAudits(data);
  };

  const saveFindings = (data: any) => {
    localStorage.setItem('ehs_audit_findings_db', JSON.stringify(data));
    setFindings(data);
  };

  const handleCreateAudit = () => {
    navigate('/audit/new');
  };

  const buildChecklist = (selectedAreas: any) => {
    const checklist: any[] = [];
    selectedAreas.forEach((areaId: any) => {
      const areaChecklist = ISO_CHECKLIST[areaId] || [];
      areaChecklist.forEach((item: any) => {
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

  const startAudit = (auditId: any) => {
    const updated = audits.map((a: any) =>
    a.id === auditId ? { ...a, status: 'in_progress' } : a
    );
    saveAudits(updated);
  };

  const completeAudit = (auditId: any) => {
    const updated = audits.map((a: any) =>
    a.id === auditId ? {
      ...a,
      status: 'completed',
      completedDate: new Date().toISOString()
    } : a
    );
    saveAudits(updated);
  };

  const deleteAudit = (id: any) => {
    setConfirmModal({ isOpen: true, payload: id });
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      saveAudits(audits.filter((a) => a.id !== confirmModal.payload));
      saveFindings(findings.filter((f) => f.auditId !== confirmModal.payload));
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const addFinding = (finding: any) => {
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

  const updateFindingStatus = (findingId: any, status: any) => {
    const updated = findings.map((f: any) =>
    f.id === findingId ? { ...f, status } : f
    );
    saveFindings(updated);
  };

  const filteredAudits = audits.filter((a: any) => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.leadAuditor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Estadísticas
  const stats = {
    total: audits.length,
    inProgress: audits.filter((a: any) => a.status === 'in_progress').length,
    completed: audits.filter((a: any) => a.status === 'completed').length,
    findings: findings.length,
    openFindings: findings.filter((f: any) => f.status === 'open').length,
    criticalFindings: findings.filter((f: any) => f.severity === 'critical').length,
    complianceRate: audits.length > 0 ?
    Math.round(audits.filter((a: any) => a.status === 'completed').length / audits.length * 100) :
    0
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 pb-24">
            <ShareModal
        isOpen={!!shareItem}
        open={!!shareItem}
        onClose={() => setShareItem(null)}
        title={`Informe Auditoría - ${shareItem?.auditTitle || shareItem?.title || ''}`}
        text={shareItem ? `📋 Informe de Auditoría EHS\n📌 Título: ${shareItem.auditTitle || shareItem.title}\n📍 Ubicación: ${shareItem.location}\n📅 Fecha: ${shareItem.date || shareItem.scheduledDate}` : ''}
        rawMessage={shareItem ? `📋 Informe de Auditoría EHS\n📌 Título: ${shareItem.auditTitle || shareItem.title}\n📍 Ubicación: ${shareItem.location}\n📅 Fecha: ${shareItem.date || shareItem.scheduledDate}` : ''}
        elementIdToPrint="pdf-content"
        fileName={`Auditoria_${(shareItem?.auditTitle || shareItem?.title || 'Reporte').replace(/\s+/g, '_')}.pdf`} />
      

            <div className="fixed left-[0] opacity-[0] top-[0] pointer-events-[none]">
                {shareItem && <AuditPdf data={shareItem} />}
            </div>

            {/* Header Premium */}
            <div className="mb-8 p-4 md:p-6 bg-white/90 dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-xl flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-4">

                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <ClipboardCheck size={32} color="#ffffff" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="m-0 text-2xl font-black text-slate-800 dark:text-slate-100">
                            Auditorías EHS
                        </h1>
                        <p className="m-0 mt-1 text-slate-500 dark:text-slate-400 text-sm font-semibold">
                            ISO 45001 • {stats.inProgress} en curso
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                    <></>
                    <button
            onClick={() => navigate('/audit/new')}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-base transition-colors shadow-lg shadow-emerald-500/30 whitespace-nowrap cursor-pointer border-none m-0">
            
                        <Plus size={20} strokeWidth={2.5} />
                        Nueva Auditoría
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{

        gridTemplateColumns: isMobile ? 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))' : 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: isMobile ? '1rem' : '2rem'
      }} className="grid">
                <StatCard
          icon={<FileText size={24} />}
          label="Total Auditorías"
          value={stats.total}
          color="#3B82F6"
          gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)"
          isMobile={isMobile} />
        
                <StatCard
          icon={<Clock size={24} />}
          label="En Curso"
          value={stats.inProgress}
          color="#f59e0b"
          gradient="linear-gradient(135deg, #f59e0b, #d97706)"
          isMobile={isMobile} />
        
                <StatCard
          icon={<CheckCircle2 size={24} />}
          label="Completadas"
          value={stats.completed}
          color="#16a34a"
          gradient="linear-gradient(135deg, #16a34a, #059669)"
          isMobile={isMobile} />
        
                <StatCard
          icon={<AlertTriangle size={24} />}
          label="Hallazgos Abiertos"
          value={stats.openFindings}
          color="#dc2626"
          gradient="linear-gradient(135deg, #dc2626, #991b1b)"
          isMobile={isMobile} />
        
            </div>

            {/* Secondary Stats */}
            <div style={{

        gridTemplateColumns: isMobile ? 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))' : 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }} className="grid">
                <div className={`bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl ${isMobile ? 'p-4' : 'p-5'}`}>
                    <div className="flex justify-between items-center mb-3">
                        <span className={`font-semibold text-slate-500 dark:text-slate-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Tasa de Cumplimiento</span>
                        <Target size={isMobile ? 18 : 20} color="#8b5cf6" />
                    </div>
                    <div className={`font-black text-purple-500 ${isMobile ? 'text-3xl' : 'text-4xl'}`}>
                        {stats.complianceRate}%
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-3 overflow-hidden">
                        <div style={{ width: `${stats.complianceRate}%` }} className="h-[100%] bg-[linear-gradient(90deg,_#8b5cf6,_#7c3aed)] rounded-[4px]" />
                    </div>
                </div>

                <div className={`bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl ${isMobile ? 'p-4' : 'p-5'}`}>
                    <div className="flex justify-between items-center mb-3">
                        <span className={`font-semibold text-slate-500 dark:text-slate-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Total Hallazgos</span>
                        <AlertTriangle size={isMobile ? 18 : 20} color="#f59e0b" />
                    </div>
                    <div className={`font-black text-amber-500 ${isMobile ? 'text-3xl' : 'text-4xl'}`}>
                        {stats.findings}
                    </div>
                    <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem' }} className="text-[var(--color-text-muted)] mt-[0.5rem]">
                        {stats.criticalFindings} críticos
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="hide-scrollbar flex gap-[0.5rem] mb-[1.5rem] border-bottom-[2px_solid_var(--color-border)] pb-[0.5rem] overflow-x-[auto] webkit-overflow-scrolling-[touch]">







        
                <TabButton
          active={activeTab === 'audits'}
          onClick={() => setActiveTab('audits')}
          icon={<ClipboardCheck size={18} />}
          label="Auditorías"
          count={audits.length}
          isMobile={isMobile} />
        
                <TabButton
          active={activeTab === 'findings'}
          onClick={() => setActiveTab('findings')}
          icon={<AlertTriangle size={18} />}
          label="Hallazgos"
          count={findings.length}
          badge={stats.openFindings}
          isMobile={isMobile} />
        
                <TabButton
          active={activeTab === 'checklist'}
          onClick={() => setActiveTab('checklist')}
          icon={<CheckSquare size={18} />}
          label="Checklist ISO"
          isMobile={isMobile} />
        
            </div>

            {/* Content by Tab */}
            {activeTab === 'audits' &&
      <>
                    {/* Search & Filters */}
                    <div className="flex gap-[1rem] mb-[1.5rem] flex-wrap">




          
                        <div className="flex-[1] min-width-[280px] relative">
                            <Search
              size={20}
              color="var(--color-text-muted)" className="absolute left-[1rem] top-[50%] transform-[translateY(-50%)] pointer-events-[none]" />







            
                            <input
              type="text"
              placeholder="Buscar por título, auditor, ubicación..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              className="input-professional w-[100%] p-[0.85rem_1rem_0.85rem_3rem] rounded-[var(--radius-lg)] border-[1px_solid_var(--color-input-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-[0.95rem] font-[500] outline-[none]" />











            
                        </div>

                        <select
            value={filterStatus}
            onChange={(e: any) => setFilterStatus(e.target.value)}
            className="input-professional p-[0.85rem_1.25rem] rounded-[var(--radius-lg)] border-[1px_solid_var(--color-input-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-[0.9rem] font-[600] outline-[none] cursor-pointer">











            
                            <option value="all">Todos los Estados</option>
                            {Object.entries(AUDIT_STATUS).map(([key, value]: any) =>
            <option key={key} value={key}>{value.label}</option>
            )}
                        </select>
                    </div>

                    {/* Audits List */}
                    {filteredAudits.length === 0 ?
        <EmptyStateIllustrated
          title="Sin Auditorías Registradas"
          description="Planificá y gestioná auditorías internas y externas según ISO 45001."
          icon={<ClipboardCheck />} /> :


        <div className="flex flex-col gap-3">
                            {filteredAudits.map((audit: any) =>
          <AuditCard
            key={audit.id}
            audit={audit}
            findings={findings}
            AUDIT_TYPES={AUDIT_TYPES}
            statusConfig={AUDIT_STATUS[audit.status] || AUDIT_STATUS.draft}
            onStart={() => startAudit(audit.id)}
            onComplete={() => completeAudit(audit.id)}
            onView={() => navigate(`/audit/${audit.id}`)}
            onEdit={() => navigate('/audit/new', { state: { editData: audit } })}
            onShare={() => setShareItem(audit)}
            onAddFinding={() => {
              setCurrentAuditForFinding(audit);
              setShowFindingModal(true);
            }}
            onDelete={() => deleteAudit(audit.id)}
            isMobile={isMobile} />

          )}
                        </div>
        }
                </>
      }

            {activeTab === 'findings' &&
      <FindingsList
        findings={findings}
        audits={audits}
        onUpdateStatus={updateFindingStatus}
        severityConfig={FINDING_SEVERITY}
        statusConfig={FINDING_STATUS}
        isMobile={isMobile} />

      }

            {activeTab === 'checklist' &&
      <ISOChecklistPanel
        checklist={ISO_CHECKLIST}
        areas={AUDIT_AREAS} />

      }

            <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, payload: null })}
        onConfirm={executeDelete}
        title="¿Eliminar auditoría?"
        message="Esta acción no se puede deshacer."
        iconEmoji="🗑️" />
      
        </div>);

}

// Componentes Auxiliares
function StatCard({ icon, label, value, color, gradient, isMobile }: any) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 backdrop-blur-xl ${isMobile ? 'flex items-center gap-3 p-3' : 'block p-5'}`}>
      
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-xl opacity-10 group-hover:opacity-25 transition-opacity duration-500" style={{ background: gradient }} />
            <div style={{ marginBottom: isMobile ? '0' : '0.75rem' }} className="flex items-center gap-[0.75rem] flex-shrink-[0]">
                <div className={`flex items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}`} style={{ background: gradient, boxShadow: `0 4px 15px ${color}40` }}>
                    {React.cloneElement(icon, { color: '#ffffff', size: isMobile ? 20 : 24 })}
                </div>
            </div>
            <div className="min-width-[0] flex-[1]">
                <div className={`font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate ${isMobile ? 'text-xs' : 'text-[0.82rem]'}`}>
                    {label}
                </div>
                <div className={`font-black text-slate-800 dark:text-slate-100 leading-none tracking-tight ${isMobile ? 'text-2xl mt-1' : 'text-4xl'}`}>
                    {value}
                </div>
            </div>
        </div>);

}

function TabButton({ active, onClick, icon, label, count, badge, isMobile }: any) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 whitespace-nowrap cursor-pointer font-extrabold text-sm transition-all duration-300 relative border-none ${isMobile ? 'px-4 py-3' : 'px-6 py-3.5'} ${active ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-b-2 border-b-purple-500 shadow-[inset_0_-4px_10px_rgba(139,92,246,0.05)]' : 'bg-transparent text-slate-500 dark:text-slate-400 border-b-2 border-b-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
      
            <span className={`flex items-center transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>
                {icon}
            </span>
            <span>{label}</span>
            {count !== undefined &&
      <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold transition-colors ${active ? 'bg-purple-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                    {count}
                </span>
      }
            {badge > 0 &&
      <span className="absolute top-[4px] right-[6px] w-[18px] h-[18px] bg-[#ef4444] text-[#fff] rounded-[50%] flex items-center justify-center text-[0.65rem] font-[900] box-shadow-[0_0_6px_rgba(239,_68,_68,_0.4)]">














        
                    {badge}
                </span>
      }
        </button>);

}

function AuditCard({ audit, findings, statusConfig, onEdit, onStart, onComplete, onView, onShare, onAddFinding, onDelete, isMobile }: any) {
  const auditType = AUDIT_TYPES.find((t: any) => t.id === audit.auditType);
  const auditFindings = findings.filter((f: any) => f.auditId === audit.id);
  const openFindings = auditFindings.filter((f: any) => f.status === 'open').length;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="card premium-glow-card flex bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] transition-[all_0.3s_cubic-bezier(0.16,_1,_0.3,_1)] relative overflow-[hidden]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: isMobile ? '1rem' : '1.5rem 1.25rem',

        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? '1rem' : '1.25rem',


        borderLeft: `5px solid ${statusConfig.color}`,

        boxShadow: isHovered ?
        `0 8px 20px rgba(0, 0, 0, 0.04), 0 0 1px 1px ${statusConfig.color}15, var(--glass-shadow)` :
        'var(--glass-shadow)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'



      }}>
      
            <div style={{





        background: `linear-gradient(90deg, ${statusConfig.color}05, transparent)`,
        opacity: isHovered ? 1 : 0


      }} className="absolute top-[0] left-[0] w-[100%] h-[100%] transition-[opacity_0.4s_ease] pointer-events-[none]" />

            {/* Top row: Icon + Info */}
            <div style={{ gap: isMobile ? '0.75rem' : '1rem' }} className="flex flex-[1] min-width-[0] items-center">
                {/* Icono */}
                <div style={{
          width: isMobile ? '44px' : '56px',
          height: isMobile ? '44px' : '56px',
          background: `${statusConfig.color}10`,
          border: `1px solid ${statusConfig.color}20`,





          transform: isHovered ? 'scale(1.05) rotate(-3deg)' : 'scale(1) rotate(0)'

        }} className="rounded-[var(--radius-xl)] flex items-center justify-center flex-shrink-[0] transition-[all_0.3s_ease]">
                    <ClipboardCheck size={isMobile ? 22 : 28} color={statusConfig.color} strokeWidth={2} />
                </div>

                {/* Información */}
                <div className="flex-[1] min-width-[0]">
                <div className="flex items-center gap-[0.85rem] mb-[0.5rem] flex-wrap">
                    <h3 className="m-[0] text-[1.15rem] font-[950] text-[var(--color-text)] font-family-[var(--font-heading)] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis]">








              
                        {auditType?.icon} {audit.title}
                    </h3>
                    <span className="badge-status p-[0.25rem_0.65rem] text-[0.68rem] font-[900]" style={{
              borderColor: `${statusConfig.color}30`,
              background: `${statusConfig.color}12`,
              color: statusConfig.color



            }}>
                        {statusConfig.label}
                    </span>
                </div>
                <div className="flex flex-wrap gap-[1rem] row-gap-[0.4rem] text-[0.82rem] text-[var(--color-text-muted)] font-[600]">







            
                    <span className="flex items-center gap-[0.35rem]">
                        <User size={13} className="text-[var(--color-text-muted)]" />
                        {audit.leadAuditor || 'Sin auditor'}
                    </span>
                    <span className="flex items-center gap-[0.35rem]">
                        <Calendar size={13} className="text-[var(--color-text-muted)]" />
                        {audit.scheduledDate ? new Date(audit.scheduledDate).toLocaleDateString('es-AR') : '-'}
                    </span>
                    <span className="flex items-center gap-[0.35rem]">
                        <Shield size={13} className="text-[var(--color-text-muted)]" />
                        {audit.standard}
                    </span>
                    {openFindings > 0 &&
            <span className="p-[0.2rem_0.5rem] bg-[#fef2f2] border-[1px_solid_#fecaca] text-[#dc2626] rounded-[var(--radius-full)] text-[0.7rem] font-[800] display-[inline-flex] items-center gap-[0.25rem]">










              
                            <AlertTriangle size={11} />
                            {openFindings} hallazgos abiertos
                        </span>
            }
                </div>
                </div>
            </div>

            {/* Acciones */}
            <div style={{ flexWrap: isMobile ? 'wrap' : 'nowrap', borderTop: isMobile ? '1px solid var(--color-border)' : 'none', paddingTop: isMobile ? '0.75rem' : '0' }} className="flex gap-[0.4rem] relative z-[2]">
                <button
          onClick={onEdit}
          style={{
            padding: isMobile ? '0.5rem 1rem' : '0.65rem',









            flex: isMobile ? 1 : 'none'


          }}
          onMouseEnter={(e) => {e.currentTarget.style.background = '#6366f112';e.currentTarget.style.borderColor = '#6366f130';}}
          onMouseLeave={(e) => {e.currentTarget.style.background = 'var(--color-background)';e.currentTarget.style.borderColor = 'var(--color-border)';}}
          title="Editar Auditoría" className="bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-lg)] cursor-pointer text-[#6366f1] transition-[all_0.2s] flex items-center justify-center gap-[0.5rem] font-[700]">
          
                    <Edit3 size={16} />
                    {isMobile && 'Editar'}
                </button>
                {audit.status === 'planned' &&
        <button
          onClick={onStart}
          style={{
            padding: isMobile ? '0.5rem 1rem' : '0.65rem 0.85rem',










            flex: isMobile ? 1 : 'none'



          }}
          onMouseEnter={(e) => {e.currentTarget.style.background = '#2563eb';}}
          onMouseLeave={(e) => {e.currentTarget.style.background = '#3b82f6';}}
          title="Iniciar Auditoría" className="bg-[#3b82f6] border-none rounded-[var(--radius-lg)] cursor-pointer text-[#fff] font-[800] text-[0.75rem] flex items-center justify-center gap-[0.35rem] transition-[all_0.2s] box-shadow-[0_4px_10px_rgba(59,_130,_246,_0.25)]">
          
                        <Clock size={15} />
                        <span>Iniciar</span>
                    </button>
        }
                {audit.status === 'in_progress' &&
        <>
                        <button
            onClick={onAddFinding}
            style={{
              padding: isMobile ? '0.5rem 1rem' : '0.65rem 0.85rem',










              flex: isMobile ? 1 : 'none'



            }}
            onMouseEnter={(e) => {e.currentTarget.style.background = '#d97706';}}
            onMouseLeave={(e) => {e.currentTarget.style.background = '#f59e0b';}}
            title="Agregar Hallazgo" className="bg-[#f59e0b] border-none rounded-[var(--radius-lg)] cursor-pointer text-[#fff] font-[800] text-[0.75rem] flex items-center justify-center gap-[0.35rem] transition-[all_0.2s] box-shadow-[0_4px_10px_rgba(245,_158,_11,_0.25)]">
            
                            <AlertTriangle size={15} />
                            <span>Hallazgo</span>
                        </button>
                        <button
            onClick={onComplete}
            style={{
              padding: isMobile ? '0.5rem 1rem' : '0.65rem 0.85rem',










              flex: isMobile ? 1 : 'none'



            }}
            onMouseEnter={(e) => {e.currentTarget.style.background = '#15803d';}}
            onMouseLeave={(e) => {e.currentTarget.style.background = '#16a34a';}}
            title="Completar Auditoría" className="bg-[#16a34a] border-none rounded-[var(--radius-lg)] cursor-pointer text-[#fff] font-[800] text-[0.75rem] flex items-center justify-center gap-[0.35rem] transition-[all_0.2s] box-shadow-[0_4px_10px_rgba(22,_163,_74,_0.25)]">
            
                            <CheckCircle2 size={15} />
                            <span>Cerrar</span>
                        </button>
                    </>
        }
                <button
          onClick={onView}
          style={{
            padding: isMobile ? '0.5rem 1rem' : '0.65rem',









            flex: isMobile ? 1 : 'none'


          }}
          onMouseEnter={(e) => {e.currentTarget.style.background = 'var(--color-border)';}}
          onMouseLeave={(e) => {e.currentTarget.style.background = 'var(--color-background)';}}
          title="Ver detalle" className="bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-lg)] cursor-pointer text-[var(--color-text)] transition-[all_0.2s] flex items-center justify-center gap-[0.5rem] font-[700]">
          
                    <Eye size={16} />
                    {isMobile && 'Ver'}
                </button>
                <button
          onClick={onShare}
          style={{
            padding: isMobile ? '0.5rem 1rem' : '0.65rem',









            flex: isMobile ? 1 : 'none'
          }}
          onMouseEnter={(e) => {e.currentTarget.style.background = '#bbf7d0';}}
          onMouseLeave={(e) => {e.currentTarget.style.background = '#dcfce7';}}
          title="Compartir PDF" className="bg-[#dcfce7] border-[1px_solid_#bbf7d0] rounded-[var(--radius-lg)] cursor-pointer text-[#16a34a] transition-[all_0.2s] flex items-center justify-center">
          
                    <Share2 size={16} />
                </button>
                <button
          onClick={onDelete}
          style={{
            padding: isMobile ? '0.5rem 1rem' : '0.65rem',









            flex: isMobile ? 'none' : 'none'
          }}
          onMouseEnter={(e) => {e.currentTarget.style.background = '#fef2f2';e.currentTarget.style.borderColor = '#fecaca';}}
          onMouseLeave={(e) => {e.currentTarget.style.background = 'var(--color-background)';e.currentTarget.style.borderColor = 'var(--color-border)';}}
          title="Eliminar" className="bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-lg)] cursor-pointer text-[#ef4444] transition-[all_0.2s] flex items-center justify-center">
          
                    <Trash2 size={16} />
                </button>
            </div>
        </div>);

}

function EmptyState({ onAdd }: any) {
  return (
    <div className="p-[4rem_2rem] text-center bg-[var(--gradient-card)] rounded-[var(--radius-2xl)] border-[2px_dashed_var(--color-border)]">





      
            <div className="w-[80px] h-[80px] m-[0_auto_1.5rem] bg-[var(--color-background)] rounded-[50%] flex items-center justify-center">








        
                <ClipboardCheck size={40} color="var(--color-text-muted)" />
            </div>
            <h3 className="m-[0_0_0.5rem_0] text-[1.25rem] font-[800] text-[var(--color-text)]">




        
                Sin Auditorías
            </h3>
            <p className="m-[0_0_1.5rem_0] text-[var(--color-text-muted)] text-[0.95rem]">



        
                Creá auditorías EHS según ISO 45001:2018
            </p>
            <button
        onClick={onAdd}
        className="btn-primary w-[auto] m-[0]">

        
                <Plus size={20} className="mr-[0.5rem]" />
                Primera Auditoría
            </button>
        </div>);

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
function FindingsList({ findings, audits, onUpdateStatus, severityConfig, statusConfig, isMobile }: any) {
  if (findings.length === 0) {
    return (
      <div className="p-[3rem_2rem] text-center bg-[var(--gradient-card)] rounded-[var(--radius-2xl)] border-[2px_dashed_var(--color-border)]">
                <CheckCircle2 size={48} color="#16a34a" className="mb-[1rem]" />
                <h3 className="m-[0_0_0.5rem_0] text-[1.1rem] font-[800]">¡Sin Hallazgos!</h3>
                <p className="text-[var(--color-text-muted)] text-[0.95rem]">No hay hallazgos registrados en las auditorías.</p>
            </div>);

  }

  return (
    <div className="flex flex-col gap-3">
            {findings.map((finding: any) => {
        const audit = audits.find((a: any) => a.id === finding.auditId);
        const severity = severityConfig[finding.severity] || severityConfig.observation;
        const status = statusConfig[finding.status] || statusConfig.open;

        return (
          <div key={finding.id} className="card" style={{ padding: isMobile ? '1rem' : '1.25rem', borderLeft: `4px solid ${severity.color}` }}>
                        <div style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '0.75rem' : '1rem' }} className="flex">
                            <div style={{ gap: isMobile ? '0.75rem' : '1rem', width: isMobile ? '100%' : 'auto' }} className="flex items-center flex-[1] min-width-[0]">
                                <span style={{ fontSize: isMobile ? '1.5rem' : '2rem' }}>{severity.icon}</span>
                                <div className="flex-[1] min-width-[0]">
                                    <div className="flex items-center gap-[0.5rem] mb-[0.5rem] flex-wrap">
                                        <h4 style={{ fontSize: isMobile ? '0.95rem' : '1rem' }} className="m-[0] font-[800]">{finding.title}</h4>
                                        <span style={{ background: severity.bg, color: severity.color }} className="p-[0.2rem_0.5rem] rounded-[var(--radius-full)] text-[0.65rem] font-[800]">{severity.label}</span>
                                        <span style={{ background: status.bg, color: status.color }} className="p-[0.2rem_0.5rem] rounded-[var(--radius-full)] text-[0.65rem] font-[800]">{status.label}</span>
                                    </div>
                                    <p className="m-[0_0_0.5rem_0] text-[0.85rem] text-[var(--color-text-muted)]">{finding.description}</p>
                                    <div style={{ gap: isMobile ? '0.5rem 1rem' : '1rem' }} className="flex flex-wrap text-[0.8rem] text-[var(--color-text-muted)]">
                                        <span>Auditoría: {audit?.title || 'N/A'}</span>
                                        <span>Fecha: {new Date(finding.createdAt).toLocaleDateString('es-AR')}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ width: isMobile ? '100%' : 'auto', borderTop: isMobile ? '1px solid var(--color-border)' : 'none', paddingTop: isMobile ? '0.5rem' : '0' }} className="flex">
                                <select
                  value={finding.status}
                  onChange={(e: any) => onUpdateStatus(finding.id, e.target.value)} className="p-[0.6rem] rounded-[var(--radius-md)] border-[1px_solid_var(--color-border)] text-[0.8rem] font-[600] w-[100%] bg-[var(--color-background)]">

                  
                                    {Object.entries(statusConfig).map(([key, value]: any) =>
                  <option key={key} value={key}>{value.label}</option>
                  )}
                                </select>
                            </div>
                        </div>
                    </div>);

      })}
        </div>);

}

function ISOChecklistPanel({ checklist, areas }: any) {
  return (
    <div className="flex flex-col gap-[1.5rem]">
            {AUDIT_AREAS.map((area: any) =>
      <div key={area.id} className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                    <h3 className="m-[0_0_1rem_0] text-[1rem] font-[800] flex items-center gap-[0.5rem]"><Shield size={18} color="#8b5cf6" />Cláusula {area.clause}: {area.name}</h3>
                    <div className="flex flex-col gap-[0.5rem]">
                        {checklist[area.id]?.map((item: any) =>
          <div key={item.id} style={{ background: item.required ? '#f8fafc' : 'var(--color-background)', border: `1px solid ${item.required ? '#e2e8f0' : 'var(--color-border)'}` }} className="p-[0.75rem] rounded-[var(--radius-lg)] flex items-center gap-[0.75rem]">
                                <span className="text-[0.75rem] font-[800] text-[var(--color-text-muted)] min-width-[30px]">{item.id}</span>
                                <span className="flex-[1] text-[0.9rem] font-[500]">{item.question}</span>
                                {item.required && <span className="text-[0.7rem] font-[700] text-[#dc2626] p-[0.2rem_0.5rem] bg-[#fef2f2] rounded-[var(--radius-full)]">REQUERIDO</span>}
                            </div>
          )}
                    </div>
                </div>
      )}
        </div>);

}

function InfoDetail({ label, value }: any) {
  return (
    <div>
            <div className="text-[0.7rem] font-[700] text-[var(--color-text-muted)] uppercase mb-[0.25rem]">{label}</div>
            <div className="text-[0.95rem] font-[600] text-[var(--color-text)]">{value}</div>
        </div>);

}