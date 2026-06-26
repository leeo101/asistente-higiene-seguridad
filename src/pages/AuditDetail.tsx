import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { XCircle, ClipboardCheck, AlertTriangle, Clock, CheckCircle2, Shield, ArrowLeft } from 'lucide-react';

const AUDIT_TYPES = [
{ id: 'internal', name: 'Auditoría Interna', icon: '📋', color: '#3b82f6' },
{ id: 'external', name: 'Auditoría Externa', icon: '🏢', color: '#8b5cf6' },
{ id: 'certification', name: 'Certificación', icon: '📜', color: '#10b981' },
{ id: 'surveillance', name: 'Seguimiento', icon: '👁️', color: '#f59e0b' },
{ id: 'compliance', name: 'Cumplimiento Legal', icon: '⚖️', color: '#dc2626' },
{ id: 'supplier', name: 'Proveedor', icon: '🤝', color: '#06b6d4' }];


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
  const navigate = useNavigate();
  const { id } = useParams();
  const [audit, setAudit] = useState<any>(null);
  const [findings, setFindings] = useState<any[]>([]);
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [newFinding, setNewFinding] = useState({ title: '', description: '', severity: 'minor', responsible: '', dueDate: '' });

  useEffect(() => {
    const auditsDb = localStorage.getItem('ehs_audits_db');
    const findingsDb = localStorage.getItem('ehs_audit_findings_db');

    if (auditsDb) {
      const audits = JSON.parse(auditsDb);
      const found = audits.find((a: any) => a.id === id);
      if (found) setAudit(found);
    }

    if (findingsDb) {
      const allFindings = JSON.parse(findingsDb);
      const auditFindings = allFindings.filter((f: any) => f.auditId === id);
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

  const updateAuditStatus = (status: string) => {
    const auditsDb = localStorage.getItem('ehs_audits_db');
    if (!auditsDb || !audit) return;

    const audits = JSON.parse(auditsDb);
    const updated = audits.map((a: any) =>
    a.id === id ? { ...a, status } : a
    );
    localStorage.setItem('ehs_audits_db', JSON.stringify(updated));
    setAudit({ ...audit, status });
  };

  if (!audit) {
    return (
      <div className="container text-center p-[4rem_2rem]">
                <h2>Cargando...</h2>
            </div>);

  }

  const auditType = AUDIT_TYPES.find((t) => t.id === audit.auditType);
  const statusConfig = (AUDIT_STATUS as any)[audit.status] || AUDIT_STATUS.draft;
  const completedChecklist = audit.checklist?.filter((c: any) => c.status !== null).length || 0;
  const totalChecklist = audit.checklist?.length || 0;
  const progress = totalChecklist > 0 ? Math.round(completedChecklist / totalChecklist * 100) : 0;

  return (
    <div className="container pb-[6rem] max-w-[900px]">
            {/* Header */}
            <div style={{


        background: `${statusConfig.bg}`,
        borderBottom: `2px solid ${statusConfig.color}`





      }} className="mb-[2rem] p-[1.5rem] rounded-[var(--radius-2xl)] border-[1px_solid_var(--glass-border)] flex justify-space-between items-center">
                <div className="flex items-center gap-4">
                    <></>
                    <div style={{


            background: `linear-gradient(135deg, ${statusConfig.color}, ${statusConfig.color}cc)`





          }} className="w-[64px] h-[64px] rounded-[var(--radius-xl)] flex items-center justify-center text-[#fff]">
                        <ClipboardCheck size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="m-0 text-2xl font-black">{auditType?.icon} {audit.title}</h2>
                        <p className="m-[0.25rem_0_0_0] text-[var(--color-text-muted)] text-[0.9rem]">{audit.location || 'Sin ubicación'} • <span style={{ color: statusConfig.color }} className="font-[800]">{statusConfig.label}</span></p>
                    </div>
                </div>
            </div>

            {/* Progreso */}
            <div className="card p-[1.5rem] mb-[2rem]">
                <h3 className="text-[0.9rem] font-[800] mb-[1rem] uppercase">Progreso de Auditoría</h3>
                <div className="p-[1rem] bg-[var(--color-background)] rounded-[var(--radius-lg)]">
                    <div className="flex justify-space-between mb-[0.5rem]">
                        <span className="text-[0.85rem] font-[600]">Checklist: {completedChecklist}/{totalChecklist} items</span>
                        <span className="text-[0.85rem] font-[800] text-[var(--color-primary)]">{progress}%</span>
                    </div>
                    <div className="h-[10px] bg-[#e2e8f0] rounded-[5px] overflow-[hidden]">
                        <div style={{ width: `${progress}%` }} className="h-[100%] bg-[linear-gradient(90deg,_#3b82f6,_#1d4ed8)] rounded-[5px]" />
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="card p-[1.5rem] mb-[2rem]">
                <h3 className="text-[0.9rem] font-[800] mb-[1rem] uppercase">Información</h3>
                <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem]">
                    <InfoDetail label="Tipo" value={auditType?.name || '-'} />
                    <InfoDetail label="Norma" value={audit.standard || '-'} />
                    <InfoDetail label="Auditor Líder" value={audit.leadAuditor || '-'} />
                    <InfoDetail label="Fecha" value={audit.scheduledDate ? new Date(audit.scheduledDate).toLocaleDateString('es-AR') : '-'} />
                    <InfoDetail label="Duración" value={audit.duration ? `${audit.duration} días` : '-'} />
                    <InfoDetail label="Departamento" value={audit.department || '-'} />
                </div>
            </div>

            {/* Hallazgos */}
            <div className="card p-[1.5rem] mb-[2rem]">
                <div className="flex justify-space-between items-center mb-[1rem]">
                    <h3 className="text-[0.9rem] font-[800] uppercase m-[0]">Hallazgos ({findings.length})</h3>
                    <button onClick={() => setShowFindingForm(!showFindingForm)} className="btn-primary p-[0.5rem_1rem] text-[0.85rem]">
                        <AlertTriangle size={16} className="display-[inline] mr-[0.25rem]" />
                        Agregar
                    </button>
                </div>

                {showFindingForm &&
        <div className="p-[1.5rem] bg-[var(--color-background)] rounded-[var(--radius-lg)] mb-[1rem]">
                        <h4 className="text-[0.85rem] font-[700] mb-[1rem]">Nuevo Hallazgo</h4>
                        <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem] mb-[1rem]">
                            <div><label className="block mb-2 text-sm font-semibold text-slate-400">Título *</label><input type="text" value={newFinding.title} onChange={(e) => setNewFinding({ ...newFinding, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="Descripción breve" /></div>
                            <div><label className="block mb-2 text-sm font-semibold text-slate-400">Severidad</label><select value={newFinding.severity} onChange={(e) => setNewFinding({ ...newFinding, severity: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors">{Object.entries(FINDING_SEVERITY).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}</select></div>
                        </div>
                        <div className="mb-[1rem]"><label className="block mb-2 text-sm font-semibold text-slate-400">Descripción *</label><textarea value={newFinding.description} onChange={(e) => setNewFinding({ ...newFinding, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors min-h-[80px]" placeholder="Descripción detallada" /></div>
                        <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem] mb-[1rem]">
                            <div><label className="block mb-2 text-sm font-semibold text-slate-400">Responsable</label><input type="text" value={newFinding.responsible} onChange={(e) => setNewFinding({ ...newFinding, responsible: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" /></div>
                            <div><label className="block mb-2 text-sm font-semibold text-slate-400">Fecha Límite</label><input type="date" value={newFinding.dueDate} onChange={(e) => setNewFinding({ ...newFinding, dueDate: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" /></div>
                        </div>
                        <div className="flex gap-[0.5rem]">
                            <button onClick={() => setShowFindingForm(false)} className="flex-[1] p-[0.75rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-lg)] font-[700] cursor-pointer">Cancelar</button>
                            <button onClick={handleAddFinding} className="btn-primary flex-[1]">Guardar</button>
                        </div>
                    </div>
        }

                <div className="flex flex-col gap-3">
                    {findings.length === 0 ?
          <p className="text-[var(--color-text-muted)] text-[0.9rem] text-center p-[2rem]">No hay hallazgos registrados</p> :

          findings.map((f, i) =>
          <div key={i} style={{ background: f.status === 'open' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${f.status === 'open' ? '#fecaca' : '#16a34a'}` }} className="p-[1rem] rounded-[var(--radius-lg)]">
                                <div className="flex justify-space-between items-center mb-[0.5rem]">
                                    <span className="text-[0.85rem] font-[700]">{(FINDING_SEVERITY as any)[f.severity]?.icon} {f.title}</span>
                                    <span style={{ background: f.status === 'open' ? '#dc2626' : '#16a34a' }} className="p-[0.25rem_0.75rem] text-[#fff] rounded-[var(--radius-full)] text-[0.7rem] font-[800]">{f.status.toUpperCase()}</span>
                                </div>
                                <p className="m-[0_0_0.5rem_0] text-[0.85rem] text-[var(--color-text-muted)]">{f.description}</p>
                                <div className="text-[0.75rem] text-[var(--color-text-muted)]">Responsable: {f.responsible || 'N/A'} • Vence: {f.dueDate ? new Date(f.dueDate).toLocaleDateString('es-AR') : 'N/A'}</div>
                            </div>
          )
          }
                </div>
            </div>

            {/* Acciones de Estado */}
            <div className="card p-[1.5rem] mb-[2rem]">
                <h3 className="text-[0.9rem] font-[800] mb-[1rem] uppercase">Acciones</h3>
                <div className="flex gap-[0.5rem] flex-wrap">
                    {audit.status === 'draft' && <button onClick={() => updateAuditStatus('planned')} className="btn-primary flex-[auto] m-[0]">Planificar</button>}
                    {audit.status === 'planned' && <button onClick={() => updateAuditStatus('in_progress')} className="btn-primary flex-[auto] m-[0] bg-[linear-gradient(135deg,_#f59e0b,_#d97706)]">Iniciar</button>}
                    {audit.status === 'in_progress' && <button onClick={() => updateAuditStatus('completed')} className="btn-primary flex-[auto] m-[0] bg-[linear-gradient(135deg,_#16a34a,_#059669)]">Completar</button>}
                    {audit.status === 'completed' && <span className="text-[#16a34a] font-[700]">✓ Auditoría Completada</span>}
                </div>
            </div>
        </div>);

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

function InfoDetail({ label, value }: {label: string;value: string;}) {
  return (
    <div>
            <div className="text-[0.7rem] font-[700] text-[var(--color-text-muted)] uppercase mb-[0.25rem]">{label}</div>
            <div className="text-[0.95rem] font-[600] text-[var(--color-text)]">{value}</div>
        </div>);

}