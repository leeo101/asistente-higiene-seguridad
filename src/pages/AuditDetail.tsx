import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Edit3,
  Printer
} from 'lucide-react';
import { safeGetLocalStorage } from '../utils/storageHelper';
import AuditPdf from '../components/AuditPdf';
import { printElementAsDocument } from '../utils/pdfHelper';
import { toast } from 'react-hot-toast';

const AUDIT_TYPES = [
  { id: 'internal', name: 'Auditoría Interna', icon: '📋', color: '#3b82f6' },
  { id: 'external', name: 'Auditoría Externa', icon: '🏢', color: '#8b5cf6' },
  { id: 'certification', name: 'Certificación', icon: '📜', color: '#10b981' },
  { id: 'surveillance', name: 'Seguimiento', icon: '👁️', color: '#f59e0b' },
  { id: 'compliance', name: 'Cumplimiento Legal SRT', icon: '⚖️', color: '#dc2626' },
  { id: 'supplier', name: 'Contratista / Proveedor', icon: '🤝', color: '#06b6d4' },
  { id: 'environmental', name: 'Ambiental ISO 14001', icon: '🌱', color: '#16a34a' }
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
  const navigate = useNavigate();
  const { id } = useParams();
  const [audit, setAudit] = useState<any>(null);
  const [findings, setFindings] = useState<any[]>([]);
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [newFinding, setNewFinding] = useState({
    title: '',
    description: '',
    severity: 'major',
    responsible: '',
    dueDate: ''
  });

  useEffect(() => {
    const audits = safeGetLocalStorage<any[]>('ehs_audits_db', []);
    const found = audits.find((a: any) => a.id === id);
    if (found) setAudit(found);

    const allFindings = safeGetLocalStorage<any[]>('ehs_audit_findings_db', []);
    const auditFindings = allFindings.filter((f: any) => f.auditId === id);
    setFindings(auditFindings);
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

    const allFindings = safeGetLocalStorage<any[]>('ehs_audit_findings_db', []);
    const updatedAll = [finding, ...allFindings];
    localStorage.setItem('ehs_audit_findings_db', JSON.stringify(updatedAll));
    setFindings([finding, ...findings]);
    setShowFindingForm(false);
    setNewFinding({ title: '', description: '', severity: 'major', responsible: '', dueDate: '' });
    toast.success('Hallazgo registrado');
  };

  const updateAuditStatus = (status: string) => {
    if (!audit) return;
    const audits = safeGetLocalStorage<any[]>('ehs_audits_db', []);
    const updated = audits.map((a: any) => (a.id === id ? { ...a, status } : a));
    localStorage.setItem('ehs_audits_db', JSON.stringify(updated));
    setAudit({ ...audit, status });
    toast.success('Estado de auditoría actualizado');
  };

  const handlePrint = async () => {
    const toastId = toast.loading('Preparando PDF de auditoría...');
    try {
      await new Promise((r) => setTimeout(r, 300));
      await printElementAsDocument('pdf-detail-audit', `Auditoria - ${audit.title || 'EHS'}`, false);
      toast.dismiss(toastId);
    } catch {
      toast.dismiss(toastId);
      window.print();
    }
  };

  if (!audit) {
    return (
      <div className="container text-center p-[4rem_2rem]">
        <h2>Cargando auditoría...</h2>
      </div>
    );
  }

  const auditType = AUDIT_TYPES.find((t) => t.id === audit.auditType);
  const statusConfig = (AUDIT_STATUS as any)[audit.status] || AUDIT_STATUS.draft;
  const checklist = Array.isArray(audit.checklist) ? audit.checklist : [];
  const siCount = checklist.filter((c: any) => c.status === 'si').length;
  const noCount = checklist.filter((c: any) => c.status === 'no').length;
  const evaluatedCount = siCount + noCount;
  const totalChecklist = checklist.length;
  const compliance =
    evaluatedCount > 0
      ? Math.round((siCount / evaluatedCount) * 100)
      : audit.complianceRate ?? 100;

  const rawDate = audit.date || audit.scheduledDate;
  const formattedDate = rawDate
    ? new Date(rawDate + (rawDate.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('es-AR')
    : '-';

  return (
    <div className="container pb-[6rem] max-w-[960px] pt-28">
      {/* Header */}
      <div
        style={{
          background: `${statusConfig.bg}`,
          borderBottom: `2px solid ${statusConfig.color}`
        }}
        className="mb-6 p-6 rounded-2xl border border-[var(--glass-border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/audit')}
            className="p-2 rounded-xl bg-white/80 text-slate-700 hover:bg-white cursor-pointer border border-slate-300"
            title="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div
            style={{
              background: `linear-gradient(135deg, ${statusConfig.color}, ${statusConfig.color}cc)`
            }}
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white shrink-0"
          >
            <ClipboardCheck size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="m-0 text-xl sm:text-2xl font-black text-slate-900">
              {auditType?.icon} {audit.title}
            </h2>
            <p className="m-[0.25rem_0_0_0] text-slate-600 text-sm">
              {audit.facilityName ? `${audit.facilityName} • ` : ''}
              {audit.location || 'Sin ubicación'} •{' '}
              <span style={{ color: statusConfig.color }} className="font-extrabold">
                {statusConfig.label}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/audit/new', { state: { editData: audit } })}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-amber-600 text-white hover:bg-amber-500 cursor-pointer border-none flex items-center gap-1.5"
          >
            <Edit3 size={15} /> Editar
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-blue-600 text-white hover:bg-blue-500 cursor-pointer border-none flex items-center gap-1.5"
          >
            <Printer size={15} /> Imprimir PDF
          </button>
        </div>
      </div>

      {/* Progreso y Cumplimiento */}
      <div className="card p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-extrabold uppercase m-0">
            Desempeño del Relevamiento ({evaluatedCount}/{totalChecklist} calificados)
          </h3>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500">
              ✓ {siCount} Conformes
            </span>
            <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-500">
              ✗ {noCount} Desvíos
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-black">
              {compliance}% Cumplimiento
            </span>
          </div>
        </div>
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            style={{ width: `${compliance}%` }}
            className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full"
          />
        </div>
      </div>

      {/* Info Grid */}
      <div className="card p-6 mb-6">
        <h3 className="text-sm font-extrabold mb-4 uppercase">Datos Generales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoDetail label="Empresa / Establecimiento" value={audit.facilityName || '-'} />
          <InfoDetail label="Ubicación / Planta" value={audit.location || '-'} />
          <InfoDetail label="Sector / Departamento" value={audit.department || '-'} />
          <InfoDetail label="Tipo de Auditoría" value={auditType?.name || '-'} />
          <InfoDetail
            label="Norma / Marco Legal"
            value={audit.standard || 'Ley 19.587 / ISO 45001:2018'}
          />
          <InfoDetail label="Auditor Líder" value={audit.auditor || audit.leadAuditor || '-'} />
          <InfoDetail label="Responsable Auditado" value={audit.auditedPerson || '-'} />
          <InfoDetail label="Fecha" value={formattedDate} />
          <InfoDetail label="Duración" value={audit.duration || '-'} />
        </div>
      </div>

      {/* Hallazgos */}
      <div className="card p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-extrabold uppercase m-0">
            Hallazgos y Desvíos ({findings.length})
          </h3>
          <button
            onClick={() => setShowFindingForm(!showFindingForm)}
            className="btn-primary p-[0.5rem_1rem] text-xs"
          >
            <AlertTriangle size={15} className="inline mr-1" />
            Agregar Hallazgo
          </button>
        </div>

        {showFindingForm && (
          <div className="p-5 bg-[var(--color-background)] rounded-xl mb-4 border border-[var(--color-border)]">
            <h4 className="text-xs font-extrabold uppercase mb-3">Nuevo Hallazgo</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block mb-1 text-xs font-semibold text-slate-400">Título *</label>
                <input
                  type="text"
                  value={newFinding.title}
                  onChange={(e) => setNewFinding({ ...newFinding, title: e.target.value })}
                  className="module-form-input"
                  style={{ padding: '10px 12px', margin: 0 }}
                  placeholder="Descripción breve"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold text-slate-400">Severidad</label>
                <select
                  value={newFinding.severity}
                  onChange={(e) => setNewFinding({ ...newFinding, severity: e.target.value })}
                  className="module-form-input"
                  style={{ padding: '10px 12px', margin: 0 }}
                >
                  {Object.entries(FINDING_SEVERITY).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.icon} {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="block mb-1 text-xs font-semibold text-slate-400">
                Evidencia y Acción Correctiva *
              </label>
              <textarea
                value={newFinding.description}
                onChange={(e) => setNewFinding({ ...newFinding, description: e.target.value })}
                className="module-form-input"
                rows={3}
                placeholder="Descripción detallada"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block mb-1 text-xs font-semibold text-slate-400">
                  Responsable
                </label>
                <input
                  type="text"
                  value={newFinding.responsible}
                  onChange={(e) => setNewFinding({ ...newFinding, responsible: e.target.value })}
                  className="module-form-input"
                  style={{ padding: '10px 12px', margin: 0 }}
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold text-slate-400">
                  Fecha Límite
                </label>
                <input
                  type="date"
                  value={newFinding.dueDate}
                  onChange={(e) => setNewFinding({ ...newFinding, dueDate: e.target.value })}
                  className="module-form-input"
                  style={{ padding: '10px 12px', margin: 0 }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFindingForm(false)}
                className="flex-1 p-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button onClick={handleAddFinding} className="btn-primary flex-1">
                Guardar
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {findings.length === 0 ? (
            <p className="text-[var(--color-text-muted)] text-sm text-center p-6">
              No hay hallazgos o desvíos abiertos en esta auditoría.
            </p>
          ) : (
            findings.map((f, i) => (
              <div
                key={f.id || i}
                style={{
                  background: f.status === 'open' ? 'rgba(239,68,68,0.08)' : 'rgba(22,163,74,0.08)',
                  border: `1px solid ${f.status === 'open' ? 'rgba(239,68,68,0.3)' : '#16a34a'}`
                }}
                className="p-4 rounded-xl"
              >
                <div className="flex justify-between items-center mb-1.5 gap-2">
                  <span className="text-sm font-bold">
                    {(FINDING_SEVERITY as any)[f.severity]?.icon} {f.title}
                  </span>
                  <span
                    style={{ background: f.status === 'open' ? '#dc2626' : '#16a34a' }}
                    className="px-2.5 py-0.5 text-white rounded-full text-[10px] font-extrabold shrink-0"
                  >
                    {f.status.toUpperCase()}
                  </span>
                </div>
                <p className="m-0 mb-1.5 text-xs text-[var(--color-text-muted)]">{f.description}</p>
                {f.correctiveAction && (
                  <p className="m-0 mb-1.5 text-xs font-semibold text-blue-400">
                    Acción Correctiva: {f.correctiveAction}
                  </p>
                )}
                <div className="text-[11px] text-[var(--color-text-muted)]">
                  Responsable: {f.responsible || 'N/A'} • Vence:{' '}
                  {f.dueDate
                    ? new Date(f.dueDate + (f.dueDate.length === 10 ? 'T12:00:00' : '')).toLocaleDateString(
                        'es-AR'
                      )
                    : 'N/A'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Acciones de Estado */}
      <div className="card p-6 mb-6">
        <h3 className="text-sm font-extrabold mb-3 uppercase">Estado de la Auditoría</h3>
        <div className="flex gap-2 flex-wrap items-center">
          {audit.status === 'draft' && (
            <button
              onClick={() => updateAuditStatus('planned')}
              className="btn-primary flex-auto m-0"
            >
              Marcar como Planificada
            </button>
          )}
          {audit.status === 'planned' && (
            <button
              onClick={() => updateAuditStatus('in_progress')}
              className="btn-primary flex-auto m-0 bg-gradient-to-r from-amber-500 to-amber-600"
            >
              Iniciar Ejecución
            </button>
          )}
          {audit.status === 'in_progress' && (
            <button
              onClick={() => updateAuditStatus('completed')}
              className="btn-primary flex-auto m-0 bg-gradient-to-r from-emerald-600 to-teal-600"
            >
              Finalizar y Cerrar Auditoría
            </button>
          )}
          {audit.status === 'completed' && (
            <span className="text-emerald-500 font-extrabold flex items-center gap-1.5">
              <CheckCircle2 size={18} /> Auditoría Completada y Cerrada
            </span>
          )}
        </div>
      </div>

      <div className="ats-pdf-offscreen" id="pdf-detail-audit">
        <AuditPdf data={audit} />
      </div>
    </div>
  );
}

function InfoDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[0.7rem] font-bold text-[var(--color-text-muted)] uppercase mb-1">
        {label}
      </div>
      <div className="text-sm font-semibold text-[var(--color-text)]">{value}</div>
    </div>
  );
}
