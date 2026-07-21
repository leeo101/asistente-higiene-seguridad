import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, ClipboardCheck, Shield, AlertTriangle, Clock, CheckCircle2, User, MapPin, Calendar, FileText, Eye, Printer, Share2, Pencil, Award } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import AuditPdf from '../components/AuditPdf';
import {
  ModuleFormLayout,
  ModuleFormToolbar,
  ModuleFormDocument,
  ModuleFormSection,
  ModuleActionBar,
} from '../components/module';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

const AUDIT_TYPES = [
{ id: 'internal', name: 'Interna', icon: '📋' },
{ id: 'external', name: 'Externa', icon: '🏢' },
{ id: 'certification', name: 'Certificación', icon: '📜' },
{ id: 'surveillance', name: 'Seguimiento', icon: '👁️' },
{ id: 'compliance', name: 'Cumplimiento Legal', icon: '⚖️' }];


const ISO_CHECKLIST_BASE: any = {
  context: [
  { id: '4.1', question: '¿Se determinaron las cuestiones internas y externas relevantes?', legal: 'ISO 45001 4.1' },
  { id: '4.2', question: '¿Se identificaron las partes interesadas y sus necesidades?', legal: 'ISO 45001 4.2' },
  { id: '4.3', question: '¿Está definido el alcance del SGSST?', legal: 'ISO 45001 4.3' }],

  leadership: [
  { id: '5.1', question: '¿La dirección demuestra liderazgo y compromiso?', legal: 'ISO 45001 5.1' },
  { id: '5.2', question: '¿Existe una política de SST documentada?', legal: 'ISO 45001 5.2' },
  { id: '5.4', question: '¿Se consulta y participa a los trabajadores?', legal: 'ISO 45001 5.4' }],

  planning: [
  { id: '6.1', question: '¿Se identifican peligros y evalúan riesgos?', legal: 'ISO 45001 6.1' },
  { id: '6.1.2', question: '¿Se determinan requisitos legales aplicables?', legal: 'ISO 45001 6.1.2' },
  { id: '6.2', question: '¿Existen objetivos de SST medibles?', legal: 'ISO 45001 6.2' }],

  support: [
  { id: '7.2', question: '¿El personal es competente para sus tareas?', legal: 'ISO 45001 7.2' },
  { id: '7.4', question: '¿Existen procesos de comunicación interna/externa?', legal: 'ISO 45001 7.4' },
  { id: '7.5', question: '¿Se controla la información documentada?', legal: 'ISO 45001 7.5' }],

  operation: [
  { id: '8.1.1', question: '¿Existe jerarquía de controles de riesgo?', legal: 'ISO 45001 8.1.1' },
  { id: '8.1.3', question: '¿Se gestionan compras y contratistas?', legal: 'ISO 45001 8.1.3' },
  { id: '8.1.4', question: '¿Existe preparación y respuesta ante emergencias?', legal: 'ISO 45001 8.1.4' }],

  performance: [
  { id: '9.1', question: '¿Se realiza seguimiento y medición del desempeño?', legal: 'ISO 45001 9.1' },
  { id: '9.2', question: '¿Se realiza auditoría interna periódica?', legal: 'ISO 45001 9.2' }],

  improvement: [
  { id: '10.2', question: '¿Se toman acciones correctivas?', legal: 'ISO 45001 10.2' },
  { id: '10.3', question: '¿Existe mejora continua del sistema?', legal: 'ISO 45001 10.3' }]

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
  const [errors, setErrors] = useState<string[]>([]);

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
      setProfessional((prev) => ({ ...prev, signature, stamp }));
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
      setAudit((prev) => ({ ...prev, checklist: newChecklist }));
    } else if (!isEdit && audit.checklist.length === 0) {
      // Default 5-item quick checklist if no areas selected
      setAudit((prev) => ({
        ...prev,
        checklist: [
        { id: 1, question: '¿Cuenta con Seguro de Vida Obligatorio?', legal: 'Ley 16.600', status: 'na', observation: '' },
        { id: 2, question: '¿Se exhibe el Afiche de la ART?', legal: 'Res. SRT 70/97', status: 'na', observation: '' },
        { id: 3, question: '¿Cuenta con Registro de Entrega de EPP?', legal: 'Res. SRT 299/11', status: 'na', observation: '' },
        { id: 4, question: '¿Los EPP cuentan con la certificación y marcado AR con trazabilidad QR?', legal: 'Res. SIyC 18/25', status: 'na', observation: '' },
        { id: 5, question: '¿Se realiza la evaluación y prevención de factores de riesgo psicosocial en el trabajo (estrés, burnout)?', legal: 'Res. SRT 28/2026', status: 'na', observation: '' },
        { id: 6, question: '¿Se encuentra presentada la Declaración Jurada de Riesgos anual ante la ART?', legal: 'Res. SRT 45/2026', status: 'na', observation: '' },
        { id: 7, question: '¿Están señalizadas las salidas de emergencia?', legal: 'Ley 19.587 Cap 18', status: 'na', observation: '' },
        { id: 8, question: '¿Los extintores poseen carga vigente, oblea y marbete reglamentarios?', legal: 'Dec. 351/79 Anexo VII', status: 'na', observation: '' }]

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
    const newErrors = [];
    if (!audit.title) newErrors.push('title');
    if (!audit.date) newErrors.push('date');
    if (!audit.auditor) newErrors.push('auditor');
    setErrors(newErrors);
    if (newErrors.length > 0) {
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
        <ModuleFormLayout>
            <ModuleFormToolbar
        title={isEdit ? 'Editar Auditoría' : 'Nueva Auditoría EHS'}
        subtitle={isEdit ? 'Actualice la información de la auditoría en curso.' : 'Registre una nueva inspección o auditoría para evaluar el cumplimiento de EHS.'}
        icon={<Shield />} />
      
        <ModuleFormDocument>
            <ModuleFormSection title="Datos de la Auditoría" icon={<FileText />}>
                <div className="flex flex-col gap-6 w-full">
                    {/* Metadatos Principales */}
                    <div style={{

            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)'





          }} className="grid gap-[1.25rem] bg-[rgba(248,_250,_252,_0.5)] p-[1.5rem] rounded-[16px] border-[1px_solid_var(--color-border)]">
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Título de la Auditoría *</label>
                            <div className="relative">
                                <input
                  type="text"
                  className={`module-form-input ${errors.includes('title') ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-[0_0_0_2px_rgba(239,68,68,0.2)]' : ''}`}
                  value={audit.title}
                  onChange={(e) => {
                    setAudit({ ...audit, title: e.target.value });
                    if (errors.includes('title')) setErrors(errors.filter(err => err !== 'title'));
                  }}
                  placeholder="Ej: Auditoría Interna Trimestral - Planta Norte" />
                
                                <div style={{ top: '50%', transform: 'translateY(-50%)' }} className="absolute left-[0.8rem] bg-[var(--color-primary-light)] p-[0.4rem] rounded-[8px] text-[white] flex">
                                    <FileText size={16} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Tipo de Auditoría</label>
                            <div className="relative">
                                <select
                  value={audit.auditType}
                  onChange={(e) => setAudit({ ...audit, auditType: e.target.value })}
                  className="module-form-input">
                                    {AUDIT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                                </select>
                                <div style={{ top: '50%', transform: 'translateY(-50%)' }} className="absolute left-[0.8rem] bg-[var(--color-secondary)] p-[0.4rem] rounded-[8px] text-[white] flex pointer-events-[none]">
                                    <Shield size={16} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Fecha Planificada *</label>
                            <div className="relative">
                                <input
                  type="date"
                  value={audit.date}
                  onChange={(e) => {
                    setAudit({ ...audit, date: e.target.value });
                    if (errors.includes('date')) setErrors(errors.filter(err => err !== 'date'));
                  }}
                  className={`module-form-input ${errors.includes('date') ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-[0_0_0_2px_rgba(239,68,68,0.2)]' : ''}`} />
                                <div style={{ top: '50%', transform: 'translateY(-50%)' }} className="absolute left-[0.8rem] bg-[var(--color-accent)] p-[0.4rem] rounded-[8px] text-[white] flex pointer-events-[none]">
                                    <Calendar size={16} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Auditor Líder *</label>
                            <div className="relative">
                                <input
                  type="text"
                  value={audit.auditor}
                  onChange={(e) => {
                    setAudit({ ...audit, auditor: e.target.value });
                    if (errors.includes('auditor')) setErrors(errors.filter(err => err !== 'auditor'));
                  }}
                  className={`module-form-input ${errors.includes('auditor') ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-[0_0_0_2px_rgba(239,68,68,0.2)]' : ''}`}
                  placeholder="Nombre del auditor" />
                
                                <div style={{ top: '50%', transform: 'translateY(-50%)' }} className="absolute left-[0.8rem] bg-[var(--color-warning)] p-[0.4rem] rounded-[8px] text-[white] flex pointer-events-[none]">
                                    <User size={16} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Ubicación / Sector</label>
                            <div className="relative">
                                <input
                  type="text"
                  value={audit.location}
                  onChange={(e) => setAudit({ ...audit, location: e.target.value })}
                  className="module-form-input"
                  placeholder="Ej: Nave de Producción" />
                
                                <div style={{ top: '50%', transform: 'translateY(-50%)' }} className="absolute left-[0.8rem] bg-[var(--color-danger)] p-[0.4rem] rounded-[8px] text-[white] flex pointer-events-[none]">
                                    <MapPin size={16} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-[2.5rem]">
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Objetivo de la Auditoría</label>
                        <textarea
              className="module-form-input"
              rows={4}
              value={audit.objective}
              onChange={(e) => setAudit({ ...audit, objective: e.target.value })}
              placeholder="Describa el propósito de esta auditoría..." />
            
                    </div>
                </div>
            </ModuleFormSection>

                    {/* Checklist ISO */}
            <ModuleFormSection title="Checklist de Cumplimiento Legal e ISO" icon={<ClipboardCheck />}>
                    <div className="mt-[1rem]">
                        <div className="flex flex-col gap-[1.25rem]">
                            {audit.checklist.map((item, idx) =>
              <div
                key={item.id}
                className="stagger-item card bg-[rgba(var(--color-surface-rgb),_0.4)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] p-[1.5rem] box-shadow-[var(--shadow-sm)] relative overflow-[hidden] transition-[all_0.25s_ease]">
                                    {/* Left Accent indicator based on compliance status */}
                                    <div style={{





                  background: item.status === 'si' ? '#10b981' : item.status === 'no' ? '#ef4444' : '#64748b'

                }} className="absolute left-[0] top-[0] bottom-[0] w-[4px] transition-[background_0.3s_ease]" />

                                    <div style={{ flexWrap: isMobile ? 'wrap' : 'nowrap' }} className="flex justify-space-between gap-[1rem] mb-[1.25rem] items-start">
                                        <div style={{ paddingLeft: '0.5rem' }} className="flex-[1] ">
                                            <div className="flex gap-[0.5rem] flex-wrap items-center mb-[0.5rem]">
                                                <span className="display-[inline-flex] items-center p-[0.2rem_0.6rem] rounded-[var(--radius-full)] text-[0.65rem] font-[850] bg-[rgba(var(--color-primary-rgb),_0.1)] text-[var(--color-primary)] border-[1px_solid_rgba(var(--color-primary-rgb),_0.2)] uppercase letter-spacing-[0.5px]">
                                                    {item.legal}
                                                </span>

                                                {item.status === 'si' &&
                      <span className="display-[inline-flex] items-center gap-[0.25rem] p-[0.2rem_0.6rem] rounded-[var(--radius-full)] text-[0.65rem] font-[800] bg-[rgba(16,_185,_129,_0.1)] text-[#10b981] border-[1px_solid_rgba(16,_185,_129,_0.2)] uppercase letter-spacing-[0.5px]">
                                                        <CheckCircle2 size={12} /> Conforme
                                                    </span>
                      }

                                                {item.status === 'no' &&
                      <span className="display-[inline-flex] items-center gap-[0.25rem] p-[0.2rem_0.6rem] rounded-[var(--radius-full)] text-[0.65rem] font-[800] bg-[rgba(239,_68,_68,_0.1)] text-[#ef4444] border-[1px_solid_rgba(239,_68,_68,_0.2)] uppercase letter-spacing-[0.5px]">
                                                        <AlertTriangle size={12} /> Desvío Detectado
                                                    </span>
                      }
                                            </div>
                                            <div className="font-[700] text-[1rem] text-[var(--color-text)] line-height-[1.4]">{item.question}</div>
                                        </div>

                                        {/* Segmented glows selector */}
                                        <div className="flex bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-lg)] p-[0.25rem] gap-[0.25rem] h-[fit-content]">
                                            {['si', 'no', 'na'].map((status) => {
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
                            borderColor: styles.borderColor,
                            background: styles.background,
                            color: styles.color,
                            boxShadow: styles.boxShadow,
                            opacity: styles.opacity
                          }} className="p-[0.45rem_1rem] text-[0.75rem] font-[800] rounded-[var(--radius-md)] border-[1px_solid] cursor-pointer uppercase transition-[all_0.2s_cubic-bezier(0.4,_0,_0.2,_1)]">
                          
                                                        {status === 'si' && '✓ si'}
                                                        {status === 'no' && '✗ no'}
                                                        {status === 'na' && '• n/a'}
                                                    </button>);

                    })}
                                        </div>
                                    </div>

                                    {/* Observación / Hallazgo */}
                                    <div style={{ paddingLeft: '0.5rem' }} className="relative mt-[0.5rem] ">
                                        <input
                    type="text"
                    className="module-form-input"
                    value={item.observation}
                    onChange={(e) => {
                      const newChecklist = [...audit.checklist];
                      newChecklist[idx].observation = e.target.value;
                      setAudit({ ...audit, checklist: newChecklist });
                    }}
                    placeholder={item.status === 'no' ? "Describa detalladamente el hallazgo o desvío crítico..." : "Observaciones opcionales..."} />
                  
                                        <FileText size={14} color="var(--color-text-light)" className="absolute left-[1.2rem] top-[1rem]" />
                                    </div>
                                </div>
              )}
                        </div>
                    </div>
            </ModuleFormSection>

                    {/* Reunión de Cierre */}
            <ModuleFormSection title="Minuta y Reunión de Cierre" icon={<Clock />}>
                    <div className="card bg-[rgba(var(--color-primary-rgb),_0.02)] p-[2rem] rounded-[var(--radius-xl)] border-[1px_solid_var(--glass-border)] box-shadow-[inset_0_0_20px_rgba(var(--color-primary-rgb),_0.01)]">
                        <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[1.5rem]">
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-slate-400">Participantes en el Cierre</label>
                                <div className="relative">
                                    <input
                    type="text"
                    value={audit.closingMeeting.participants}
                    onChange={(e) => setAudit({ ...audit, closingMeeting: { ...audit.closingMeeting, participants: e.target.value } })}
                    className="module-form-input pl-10"
                    placeholder="Nombres de los presentes" />
                  
                                    <User size={16} color="var(--color-text-light)" style={{ top: '50%', transform: 'translateY(-50%)' }} className="absolute left-[0.9rem]" />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-slate-400">Fecha de Reunión de Cierre</label>
                                <div className="relative">
                                    <input
                    type="date"
                    value={audit.closingMeeting.date}
                    onChange={(e) => setAudit({ ...audit, closingMeeting: { ...audit.closingMeeting, date: e.target.value } })}
                    className="module-form-input pl-10" />
                                    <Calendar size={16} color="var(--color-text-light)" style={{ top: '50%', transform: 'translateY(-50%)' }} className="absolute left-[0.9rem] pointer-events-[none]" />
                                </div>
                            </div>
                            <div className="grid-column-[span_2]">
                                <label className="block mb-2 text-sm font-semibold text-slate-400">Conclusiones Generales</label>
                                <div className="relative">
                                    <textarea
                    value={audit.closingMeeting.conclusions}
                    onChange={(e) => setAudit({ ...audit, closingMeeting: { ...audit.closingMeeting, conclusions: e.target.value } })}
                    className="module-form-input pl-10"
                    rows={4}
                    placeholder="Resumen de hallazgos críticos, fortalezas detectadas y cumplimiento general de la norma..." />
                  
                                    <Award size={16} color="var(--color-text-light)" style={{ top: '50%', transform: 'translateY(-50%)' }} className="absolute left-[0.9rem]" />
                                </div>
                              </div>
                    </div>
                    </div>
            </ModuleFormSection>

                    {/* Firmas y Autorizaciones */}
            <ModuleFormSection title="Firmas y Autorizaciones EHS" icon={<Pencil />}>
                    <div className="card bg-[rgba(var(--color-surface-rgb),_0.3)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] p-[2rem]">
                        {/* Custom visual switches */}
                        <div className="no-print mb-8 p-6 bg-[rgba(30,_41,_59,_0.2)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] w-[100%] flex flex-col gap-[1.25rem] justify-center items-center">
                            <div className="text-[var(--color-text)] font-[800] text-[0.85rem] uppercase letter-spacing-[0.5px]">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                            <div className="flex gap-[1rem] flex-wrap justify-center">
                                {[
                { id: 'operator', label: 'Persona Auditada' },
                { id: 'professional', label: 'Auditor Líder' },
                { id: 'supervisor', label: 'Supervisión / Cierre' }].
                map((sig) => {
                  const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                  return (
                    <label
                      key={sig.id}
                      className="flex items-center gap-2 cursor-pointer select-none p-[0.55rem_1.1rem] rounded-[var(--radius-full)] font-[750] text-[0.8rem] transition-[all_0.2s_ease] whitespace-nowrap"
                      style={{


                        border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: isChecked ? 'rgba(var(--color-primary-rgb), 0.15)' : 'transparent',
                        color: isChecked ? 'var(--color-primary)' : 'var(--color-text-light)',



                        boxShadow: isChecked ? '0 0 10px rgba(var(--color-primary-rgb), 0.15)' : 'none'
                      }}>
                      
                                            <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setShowSignatures((s) => ({ ...s, [sig.id]: e.target.checked }))} className="hidden" />

                      
                                            <div style={{



                        border: isChecked ? '2px solid var(--color-primary)' : '2px solid var(--color-text-light)',
                        background: isChecked ? 'var(--color-primary)' : 'transparent'




                      }} className="w-[16px] h-[16px] rounded-[4px] flex items-center justify-center transition-[all_0.2s_ease]">
                                                {isChecked && <CheckCircle2 size={12} color="white" />}
                                            </div>
                                            {sig.label}
                                        </label>);

                })}
                            </div>
                        </div>

                        {/* On-Sheet Visual Preview of PDF signature blocks */}
                        <div className="mb-[2.5rem]">
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
                } : null} />
              
            <PdfBrandingFooter />
                        </div>

                        {/* Interactive Signature Drawing Pads */}
                        <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid gap-[1.5rem]" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                            {showSignatures.operator &&
              <div className="bg-[rgba(30,_41,_59,_0.1)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] p-[1.25rem] box-shadow-[var(--shadow-sm)]">
                                    <SignatureCanvas
                  onSave={(sig) => setAudit((prev) => ({ ...prev, operatorSignature: sig || '' }))}
                  initialImage={audit.operatorSignature}
                  label="Firma de Persona Auditada / Responsable" />
                
                                </div>
              }

                            {showSignatures.professional &&
              <div className="bg-[rgba(30,_41,_59,_0.1)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] p-[1.25rem] box-shadow-[var(--shadow-sm)]">
                                    <SignatureCanvas
                  onSave={(sig) => setAudit((prev) => ({ ...prev, signature: sig || '' }))}
                  initialImage={audit.signature}
                  label="Firma de Auditor Líder" />
                
                                </div>
              }

                            {showSignatures.supervisor &&
              <div className="bg-[rgba(30,_41,_59,_0.1)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] p-[1.25rem] box-shadow-[var(--shadow-sm)]">
                                    <SignatureCanvas
                  onSave={(sig) => setAudit((prev) => ({ ...prev, supervisorSignature: sig || '' }))}
                  initialImage={audit.supervisorSignature}
                  label="Firma de Supervisión / Cierre" />
                
                                </div>
              }
                        </div>
                    </div>
            </ModuleFormSection>
        </ModuleFormDocument>

            <ModuleActionBar
              actions={[
                { id: 'save', label: 'GUARDAR AUDITORÍA', icon: <Save />, variant: 'primary', onClick: () => requirePro(handleSave) },
                { id: 'share', label: 'COMPARTIR', icon: <Share2 />, variant: 'secondary', onClick: () => requirePro(() => setShowShareModal(true)) },
                { id: 'print', label: 'IMPRIMIR PDF', icon: <Printer />, variant: 'secondary', onClick: () => requirePro(() => window.print()) }
              ]}
            />

            <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Reporte de Auditoría"
        rawMessage={`Reporte de Auditoría: ${audit.title}`}
        text={`Reporte de Auditoría: ${audit.title}`}
        fileName={`Auditoria_${audit.title || 'Sin_Nombre'}.pdf`} />
      

            <div className="print-only fixed left-[-9999px] top-[0] opacity-[0] pointer-events-[none]" id="pdf-content">
                <AuditPdf data={{ ...audit, showSignatures, createdAt: audit.createdAt || new Date().toISOString() }} />
            </div>
        </ModuleFormLayout>);

}