import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Plus, Trash2, Save, Share2, Printer,
  Users, Calendar, User, Building2, FileText, ChevronDown,
  CheckCircle2, Clock, Search, Eye, Edit3, History, Pencil,
  Briefcase, MapPin, Award, UserCheck, Download, ArrowLeft } from
'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import ShareModal from '../components/ShareModal';
import Breadcrumbs from '../components/Breadcrumbs';
import CompanyLogo from '../components/CompanyLogo';
import ToolboxTalkPdfGenerator from '../components/ToolboxTalkPdfGenerator';
import toast from 'react-hot-toast';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import { DataTable } from '../components/DataTable';
import { downloadCSV } from '../services/exportCsv';
import PremiumHeader from '../components/PremiumHeader';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

function DeleteConfirm({ onConfirm, onCancel }: any) {
  return (
    <ConfirmModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="¿Eliminar registro?"
      message="Esta acción no se puede deshacer."
      iconEmoji="🗑️" />);


}

const STORAGE_KEY = 'ehs_toolbox_talks';

const TOPICS_TEMPLATES = [
{ icon: '🦺', label: 'Uso correcto de EPP' },
{ icon: '🧹', label: 'Orden y limpieza en el lugar de trabajo' },
{ icon: '⚡', label: 'Riesgos eléctricos' },
{ icon: '🔥', label: 'Prevención y control de incendios' },
{ icon: '🚧', label: 'Trabajos en altura' },
{ icon: '🧰', label: 'Uso seguro de herramientas' },
{ icon: '🚗', label: 'Seguridad vial y manejo defensivo' },
{ icon: '🧪', label: 'Manejo de sustancias peligrosas' },
{ icon: '💪', label: 'Ergonomía y manejo manual de cargas' },
{ icon: '🆘', label: 'Plan de emergencia y evacuación' },
{ icon: '👷', label: 'Señalización de seguridad' },
{ icon: '🤝', label: 'Reporte de incidentes y casi accidentes' },
{ icon: '☀️', label: 'Estrés térmico y golpe de calor' },
{ icon: '🔒', label: 'LOTO - Bloqueo y etiquetado' },
{ icon: '🏗️', label: 'Espacios confinados' }];


interface Attendee {
  id: string;
  nombre: string;
  dni: string;
  firma: boolean;
}

interface ToolboxTalk {
  id: string;
  fecha: string;
  empresa: string;
  area: string;
  responsable: string;
  cargoResponsable: string;
  tema: string;
  desarrollo: string;
  observaciones: string;
  asistentes: Attendee[];
  createdAt: string;
  operatorSignature?: string;
  signature?: string;
  supervisorSignature?: string;
  showSignatures?: {operator: boolean;professional: boolean;supervisor: boolean;};
}

const emptyTalk = (): ToolboxTalk => ({
  id: '',
  fecha: new Date().toISOString().split('T')[0],
  empresa: '',
  area: '',
  responsable: '',
  cargoResponsable: '',
  tema: '',
  desarrollo: '',
  observaciones: '',
  asistentes: [{ id: `att-${Date.now()}`, nombre: '', dni: '', firma: false }],
  createdAt: '',
  operatorSignature: '',
  signature: '',
  supervisorSignature: '',
  showSignatures: { operator: false, professional: true, supervisor: false }
});

const printStyles = `
@media print {
    .no-print { display: none !important; }
    .print-area { 
        display: block !important; 
        width: 100% !important; 
        position: static !important;
        background: white !important; 
        color: black !important;
        opacity: 1 !important;
        visibility: visible !important;
    }
    .print-area * { color: black !important; }
    body { background: white !important; color: black !important; }
    @page { size: A4 portrait; margin: 10mm; }
}
`;

/* ── Premium Stat Card ── */
function ToolboxStatCard({ icon, label, value, color, gradient }: {icon: React.ReactNode;label: string;value: string | number;color: string;gradient: string;}) {
  return (
    <div className="toolbox-stat-card">
            <div className="toolbox-stat-glow" style={{ background: `radial-gradient(circle, ${color}33 0%, transparent 70%)` }} />
            <div className="flex items-center gap-[0.75rem] mb-[1rem] relative z-[1]">
                <div style={{

          background: gradient,


          boxShadow: `0 8px 24px ${color}30`

        }} className="w-[44] h-[44] rounded-[var(--radius-xl)] flex items-center justify-center text-[#ffffff]">
                    {icon}
                </div>
            </div>
            <div className="relative z-[1] text-[2rem] font-[900] text-[var(--color-text)] line-height-[1] letter-spacing-[-1px] mb-[0.25rem]">
                {value}
            </div>
            <div className="relative z-[1] text-[0.75rem] font-[700] text-[var(--color-text-muted)] uppercase letter-spacing-[0.5px]">
                {label}
            </div>
        </div>);

}

/* ── Section Header ── */
function SectionHeader({ icon, title, rightContent }: {icon: React.ReactNode;title: string;rightContent?: React.ReactNode;}) {
  return (
    <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <h3 className="m-[0] font-[900] text-[1.1rem] text-[var(--color-text)] flex items-center gap-[0.6rem] uppercase letter-spacing-[0.5px]">




        
                <div className="w-[36] h-[36] bg-[linear-gradient(135deg,_#0052CC,_#0077ff)] rounded-[10] flex items-center justify-center box-shadow-[0_4px_12px_rgba(0,_82,_204,_0.25)]">





          
                    {icon}
                </div>
                {title}
            </h3>
            {rightContent}
        </div>);

}

/* ── Input with Icon ── */
function IconInput({ icon, label, ...props }: {icon: React.ReactNode;label: string;[key: string]: any;}) {
  return (
    <div>
            <label className="toolbox-input-label">{label}</label>
            <div className="relative">
                <div className="absolute left-[14] top-[50%] transform-[translateY(-50%)] text-[#64748b] pointer-events-[none] flex">


          
                    {icon}
                </div>
                <input className="toolbox-input-pro toolbox-focus-glow" {...props} />
            </div>
        </div>);

}

export default function ToolboxTalk(): React.ReactElement {
  const { requirePro } = usePaywall();
  useDocumentTitle('Charla de 5 Minutos');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [talks, setTalks] = useState<ToolboxTalk[]>([]);
  const [form, setForm] = useState<ToolboxTalk>(emptyTalk());
  const [shareItem, setShareItem] = useState<ToolboxTalk | null>(null);
  const [showTopics, setShowTopics] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [professional, setProfessional] = useState({ name: '', license: '', signature: null as string | null, stamp: null as string | null });

  const [showSignatures, setShowSignatures] = useState({
    operator: false,
    professional: true,
    supervisor: false
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [showForm]);

  useEffect(() => {
    if (form.showSignatures) {
      setShowSignatures(form.showSignatures);
    }
  }, [form.showSignatures]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setTalks(JSON.parse(raw));

    // Load professional data
    try {
      const pd = localStorage.getItem('personalData');
      const sd = localStorage.getItem('signatureStampData');
      const lg = localStorage.getItem('capturedSignature');
      let sig = lg || null;
      let stamp = null as string | null;
      if (sd) {const p = JSON.parse(sd);sig = p.signature || sig;stamp = p.stamp || null;}
      const name = pd ? JSON.parse(pd).name || '' : '';
      const license = pd ? JSON.parse(pd).license || '' : '';
      setProfessional({ name, license, signature: sig, stamp });
    } catch {}
  }, []);

  const save = (data: ToolboxTalk[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setTalks(data);
  };

  const handleSave = () => {
    if (!form.tema.trim() || !form.responsable.trim()) {
      toast.error('Completá el tema y el responsable');
      return;
    }
    const entry: ToolboxTalk = {
      ...form,
      id: editId || `talk-${Date.now()}`,
      createdAt: form.createdAt || new Date().toISOString(),
      showSignatures
    };
    let updated: ToolboxTalk[];
    if (editId) {
      updated = talks.map((t) => t.id === editId ? entry : t);
      toast.success('Charla actualizada ✅');
    } else {
      updated = [entry, ...talks];
      toast.success('Charla de 5 minutos guardada 📋');
    }
    save(updated);
    setEditId(null);
    setForm(emptyTalk());
    setShowSignatures({ operator: false, professional: true, supervisor: false });
  };

  const handleEdit = (talk: ToolboxTalk) => {
    setForm(talk);
    setEditId(talk.id);
    setShowSignatures(talk.showSignatures || { operator: false, professional: true, supervisor: false });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    save(talks.filter((t) => t.id !== deleteTarget));
    setDeleteTarget(null);
    toast.success('Charla eliminada');
  };

  const addAttendee = () => {
    setForm((f) => ({
      ...f,
      asistentes: [...f.asistentes, { id: `att-${Date.now()}`, nombre: '', dni: '', firma: false }]
    }));
  };

  const removeAttendee = (id: string) => {
    setForm((f) => ({ ...f, asistentes: f.asistentes.filter((a) => a.id !== id) }));
  };

  const updateAttendee = (id: string, field: keyof Attendee, value: any) => {
    setForm((f) => ({ ...f, asistentes: f.asistentes.map((a) => a.id === id ? { ...a, [field]: value } : a) }));
  };

  const filteredTalks = talks.filter((t) =>
  t.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
  t.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
  t.responsable.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    downloadCSV(talks.map((i) => ({
      fecha: new Date(i.fecha).toLocaleDateString(),
      tema: i.tema || '',
      area: i.area || '',
      responsable: i.responsable || '',
      asistentes: i.asistentes.filter((a) => a.nombre).length,
      firmas: i.asistentes.filter((a) => a.firma).length
    })), 'charlas_5min', {
      fecha: 'Fecha', tema: 'Tema', area: 'Área', responsable: 'Responsable', asistentes: 'Cant. Asistentes', firmas: 'Firmas Recabadas'
    });
  };

  const columns = [
  {
    header: 'Fecha',
    accessor: 'fecha',
    sortable: true,
    render: (item: ToolboxTalk) =>
    <span className="flex items-center gap-[0.4rem] text-[var(--color-text-muted)] white-space-[nowrap]">
                    <Calendar size={14} /> {new Date(item.fecha + 'T12:00').toLocaleDateString('es-AR')}
                </span>

  },
  {
    header: 'Tema',
    accessor: 'tema',
    sortable: true,
    render: (item: ToolboxTalk) =>
    <div className="flex items-center gap-[0.8rem]">
                    <div className="bg-[rgba(0,82,204,0.1)] p-[0.5rem] rounded-[8px] text-[#0052CC]">
                        <MessageSquare size={16} />
                    </div>
                    <div>
                        <div className="font-[700] max-w-[250px] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis]">{item.tema || 'Sin tema'}</div>
                        <div className="text-[0.75rem] text-[var(--color-text-muted)] mt-[2px]">{item.area} • {item.responsable}</div>
                    </div>
                </div>

  },
  {
    header: 'Asistencia',
    accessor: 'asistentes',
    render: (item: ToolboxTalk) => {
      const asis = item.asistentes.filter((a) => a.nombre).length;
      const firm = item.asistentes.filter((a) => a.firma).length;
      return (
        <div className="flex items-center gap-[0.8rem]">
                        <span title="Asistentes" className="flex items-center gap-[0.2rem] text-[var(--color-text-muted)]"><Users size={14} /> {asis}</span>
                        <span style={{ color: firm === asis && asis > 0 ? '#10b981' : '#f59e0b' }} title="Firmas" className="flex items-center gap-[0.2rem]"><CheckCircle2 size={14} /> {firm}</span>
                    </div>);

    }
  },
  {
    header: 'Acciones',
    accessor: 'id',
    render: (item: ToolboxTalk) =>
    <div className="flex gap-[0.4rem]">
                    <button onClick={() => {handleEdit(item);}} className="p-[0.4rem_0.8rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[8px] cursor-pointer text-[0.75rem] font-[700] text-[var(--color-text)] flex items-center gap-[4px]"><Edit3 size={15} /> Editar</button>
                    <button onClick={() => {requirePro(() => setShareItem(item));}} title="Compartir" className="p-[0.4rem] bg-[rgba(22,163,74,0.08)] border-[1px_solid_rgba(22,163,74,0.2)] rounded-[8px] text-[#16a34a] cursor-pointer"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} className="p-[0.4rem] bg-[rgba(239,68,68,0.08)] border-[1px_solid_rgba(239,68,68,0.2)] rounded-[8px] text-[#ef4444] cursor-pointer"><Trash2 size={15} /></button>
                </div>

  }];


  // Dashboard stats
  const totalCharlas = talks.length;
  const totalAsistentes = talks.reduce((acc, t) => acc + t.asistentes.filter((a) => a.nombre).length, 0);
  const totalFirmados = talks.reduce((acc, t) => acc + t.asistentes.filter((a) => a.firma).length, 0);
  const tasaFirma = totalAsistentes > 0 ? Math.round(totalFirmados / totalAsistentes * 100) : 0;

  return (
    <>
            <style>{printStyles}</style>
            <div className="container no-print pt-[6rem] pb-[6rem] max-w-[900]">
                <Breadcrumbs />

                <ShareModal
          isOpen={!!shareItem}
          open={!!shareItem}
          onClose={() => setShareItem(null)}
          title={`Charla de 5 Minutos — ${shareItem?.tema}`}
          text={shareItem ? `📋 Charla de 5 Minutos\n📅 Fecha: ${shareItem.fecha}\n👷 Responsable: ${shareItem.responsable}\n🏢 Área: ${shareItem.area}\n📌 Tema: ${shareItem.tema}\n👥 Asistentes: ${shareItem.asistentes.filter((a) => a.nombre).length}` : ''}
          rawMessage={shareItem ? `📋 Charla de 5 Minutos\n📅 Fecha: ${shareItem.fecha}\n👷 Responsable: ${shareItem.responsable}\n🏢 Área: ${shareItem.area}\n📌 Tema: ${shareItem.tema}\n👥 Asistentes: ${shareItem.asistentes.filter((a) => a.nombre).length}` : ''}
          elementIdToPrint="toolbox-pdf-content"
          fileName={`Charla_5min_${shareItem?.tema?.replace(/\s+/g, '_') || 'sin_tema'}.pdf`} />
        
                <div className="absolute left-[0] opacity-[0.01] top-[-12000px] pointer-events-[none]">
                    {shareItem && <ToolboxTalkPdfGenerator data={{ ...shareItem, showSignatures: shareItem.showSignatures || { operator: false, professional: true, supervisor: false } }} professional={professional} />}
                </div>

                {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}

                {/* Floating Action Buttons */}
                {showForm &&
        <div className="no-print floating-action-bar">
                        <button onClick={(e) => {e.preventDefault();requirePro(handleSave);}} className="btn-floating-action bg-[linear-gradient(135deg,_#10b981,_#059669)] text-[#fff]">
                            <Save size={18} /> GUARDAR
                        </button>
                        <button onClick={() => requirePro(() => window.print())} className="btn-floating-action bg-[linear-gradient(135deg,_#f59e0b,_#d97706)] text-[#fff]">
                            <Printer size={18} /> IMPRIMIR
                        </button>
                    </div>
        }

                {!showForm ?
        <>
                        <PremiumHeader onBack={showForm ? () => {setShowForm(false);} : undefined}
          title="Charla de 5 Minutos"
          subtitle="Registro de asistentes y firma digital"
          icon={<MessageSquare size={36} color="#ffffff" />} />
          

                        {/* ═══ Stats Dashboard ═══ */}
                        <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(180px,_1fr))] gap-[1rem] mb-[1.5rem]">
                            <ToolboxStatCard
              icon={<MessageSquare size={20} color="#fff" />}
              label="Charlas Dictadas"
              value={totalCharlas}
              color="#8b5cf6"
              gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)" />
            
                            <ToolboxStatCard
              icon={<Users size={20} color="#fff" />}
              label="Personal Capacitado"
              value={totalAsistentes}
              color="#10b981"
              gradient="linear-gradient(135deg, #10b981, #059669)" />
            
                            <ToolboxStatCard
              icon={<CheckCircle2 size={20} color="#fff" />}
              label="Firmas Obtenidas"
              value={totalFirmados}
              color="#0052CC"
              gradient="linear-gradient(135deg, #0052CC, #0077ff)" />
            
                            <ToolboxStatCard
              icon={<Award size={20} color="#fff" />}
              label="Tasa de Firma"
              value={`${tasaFirma}%`}
              color="#f59e0b"
              gradient="linear-gradient(135deg, #f59e0b, #d97706)" />
            
                        </div>
                        <div className="mb-[1.5rem] flex gap-[1rem] flex-wrap items-center">
                            <></>
                            <button
              onClick={() => {
                setForm(emptyTalk());
                setEditId(null);
                setShowForm(true);
              }} className="flex-[0_1_auto] p-[1rem_1.5rem] rounded-[16px] bg-[#36B37E] text-[#fff] border-none font-[800] text-[1rem] cursor-pointer flex items-center gap-[0.5rem] box-shadow-[0_4px_15px_rgba(54,179,126,0.3)] white-space-[nowrap]">

              
                                <Plus size={20} /> Nueva Charla
                            </button>
                            <div className="flex-[1_1_100%] min-width-[0] relative">
                                <Search size={20} className="absolute left-[1rem] top-[50%] transform-[translateY(-50%)] text-[var(--color-text-muted)]" />
                                <input
                type="text"
                placeholder="Buscar por tema, área o responsable..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} className="w-[100%] p-[1rem_1rem_1rem_3rem] rounded-[16px] border-[2px_solid_var(--color-border)] text-[1rem] outline-[none] bg-[var(--color-surface)] box-shadow-[0_4px_20px_rgba(0,0,0,0.05)]" />

              
                            </div>
                            {talks.length > 0 &&
            <button onClick={handleExportCSV} className="flex-[0_1_auto] flex items-center gap-[0.4rem] bg-[var(--color-primary)] border-none rounded-[16px] p-[1rem_1.5rem] text-[1rem] font-[800] cursor-pointer text-[#ffffff] box-shadow-[0_4px_15px_rgba(0,0,0,0.1)]">
                                    <Download size={20} /> Excel
                                </button>
            }
                        </div>

                        <DataTable
            data={filteredTalks}
            columns={columns}
            searchPlaceholder="Buscar..."
            emptyMessage="No hay charlas registradas."
            emptyIcon={<MessageSquare size={48} />} />
          
                    </> :

        <>
                        <div className="no-print">
                            <PremiumHeader onBack={showForm ? () => {setShowForm(false);} : undefined}
            title={editId ? 'Editar Charla' : 'Nueva Charla'}
            subtitle="Registro de asistentes y firma digital"
            icon={<MessageSquare size={36} color="#ffffff" />} />
            
                            <div className="mt-[1.5rem] mb-[1.5rem] z-[10]">
                                <></>
                            </div>
                        </div>

                        {/* ═══ DATOS GENERALES ═══ */}
                        <div className="toolbox-glass-section no-print mb-6">
                            <SectionHeader
              icon={<Building2 size={18} color="#fff" />}
              title="Datos Generales" />
            
                            <div style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))' }} className="grid gap-[1rem]">
                                <IconInput icon={<Calendar size={16} />} label="Fecha"
              type="date" value={form.fecha}
              onChange={(e: any) => setForm((f) => ({ ...f, fecha: e.target.value }))} />
              
                                <IconInput icon={<Building2 size={16} />} label="Empresa / Establecimiento"
              type="text" value={form.empresa}
              onChange={(e: any) => setForm((f) => ({ ...f, empresa: e.target.value }))}
              placeholder="Nombre de la empresa" />
              
                                <IconInput icon={<MapPin size={16} />} label="Área / Sector"
              type="text" value={form.area}
              onChange={(e: any) => setForm((f) => ({ ...f, area: e.target.value }))}
              placeholder="Ej: Producción, Almacén..." />
              
                                <IconInput icon={<User size={16} />} label="Responsable de la Charla"
              type="text" value={form.responsable}
              onChange={(e: any) => setForm((f) => ({ ...f, responsable: e.target.value }))}
              placeholder="Nombre y apellido" />
              
                                <IconInput icon={<Briefcase size={16} />} label="Cargo del Responsable"
              type="text" value={form.cargoResponsable}
              onChange={(e: any) => setForm((f) => ({ ...f, cargoResponsable: e.target.value }))}
              placeholder="Ej: Supervisor, HSYMA..." />
              
                            </div>

                            {/* ── Tema con plantillas ── */}
                            <div className="mt-[1.25rem]">
                                <label className="toolbox-input-label">Tema de la Charla *</label>
                                <div className="relative flex items-center">
                                    <input type="text" value={form.tema}
                onChange={(e) => setForm((f) => ({ ...f, tema: e.target.value }))}
                placeholder="Ingresá o seleccioná un tema..."
                className="toolbox-input-plain toolbox-focus-glow pr-[110px]" />

                
                                    <button
                  onClick={() => setShowTopics((s) => !s)}
                  style={{


                    background: showTopics ? 'rgba(0,82,204,0.1)' : 'linear-gradient(135deg, #0052CC, #0077ff)',
                    color: showTopics ? '#0052CC' : '#fff',




                    boxShadow: showTopics ? 'none' : '0 2px 8px rgba(0,82,204,0.25)'

                  }} className="absolute right-[6px] p-[0.4rem_0.8rem] border-none rounded-[10px] font-[700] cursor-pointer flex items-center gap-[0.35rem] text-[0.75rem] transition-[all_0.2s_cubic-bezier(0.4,_0,_0.2,_1)]">
                  
                                        <ChevronDown size={14} style={{

                    transform: showTopics ? 'rotate(180deg)' : 'rotate(0deg)'
                  }} className="transition-[transform_0.25s]" /> 
                                        {showTopics ? 'Cerrar' : 'Plantillas'}
                                    </button>
                                </div>

                                {/* ── Topic Chips Gallery ── */}
                                {showTopics &&
              <div className="mt-[0.85rem] grid grid-template-columns-[repeat(auto-fill,_minmax(210px,_1fr))] gap-[0.6rem] animation-[fadeIn_0.25s_ease-out]">





                
                                        {TOPICS_TEMPLATES.map((t) =>
                <button key={t.label}
                className="toolbox-topic-chip"
                onClick={() => {
                  setForm((f) => ({ ...f, tema: t.label }));
                  setShowTopics(false);
                }}>
                  
                                                <span>{t.icon}</span> <span className="flex-[1] text-left">{t.label}</span>
                                            </button>
                )}
                                    </div>
              }
                            </div>

                            {/* ── Desarrollo ── */}
                            <div className="mt-[1.25rem]">
                                <label className="toolbox-input-label">Desarrollo / Puntos Tratados</label>
                                <textarea value={form.desarrollo}
              onChange={(e) => setForm((f) => ({ ...f, desarrollo: e.target.value }))}
              placeholder="Describí los puntos principales de la charla, consultas del personal, acuerdos..."
              className="toolbox-input-plain toolbox-focus-glow min-h-[120px] resize-[vertical] line-height-[1.5]" />

              
                            </div>

                            {/* ── Observaciones ── */}
                            <div className="mt-[1rem]">
                                <label className="block text-[0.7rem] font-[800] uppercase letter-spacing-[0.06em] text-[var(--color-text-muted)] mb-[0.4rem]">



                
                                    Observaciones
                                </label>
                                <textarea value={form.observaciones}
              onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
              placeholder="Dudas, compromisos, acciones a tomar..."
              className="toolbox-input-plain toolbox-focus-glow min-h-[70] resize-[vertical] font-family-[inherit]" />

              
                            </div>
                        </div>

                        {/* ═══ LISTA DE ASISTENTES ═══ */}
                        <div className="toolbox-glass-section no-print mb-6">
                            <SectionHeader
              icon={<Users size={18} color="#fff" />}
              title={`Lista de Asistentes (${form.asistentes.filter((a) => a.nombre).length})`}
              rightContent={
              <button onClick={addAttendee} className="p-[0.5rem_1.1rem] bg-[linear-gradient(135deg,_#0052CC,_#0077ff)] text-[#fff] border-none rounded-[12] font-[700] cursor-pointer flex items-center gap-[0.4rem] text-[0.82rem] box-shadow-[0_4px_12px_rgba(0,82,204,0.25)] transition-[all_0.2s]">









                
                                        <Plus size={16} /> Agregar
                                    </button>
              } />
            

                            <div className="flex flex-col gap-[0.25rem]">
                                {form.asistentes.map((att, idx) =>
              <div key={att.id} className="toolbox-asistente-card">
                                        <span className="toolbox-asistente-badge">Asistente #{idx + 1}</span>
                                        <div style={{

                  gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr auto auto'


                }} className="grid gap-[0.6rem] items-center">
                                            <input type="text" value={att.nombre}
                  onChange={(e) => updateAttendee(att.id, 'nombre', e.target.value)}
                  placeholder={`Nombre completo`}
                  className="toolbox-input-plain toolbox-focus-glow" />
                  
                                            <input type="text" value={att.dni}
                  onChange={(e) => updateAttendee(att.id, 'dni', e.target.value)}
                  placeholder="DNI"
                  className="toolbox-input-plain toolbox-focus-glow" />
                  
                                            <button
                    onClick={() => updateAttendee(att.id, 'firma', !att.firma)}
                    className={`toolbox-signature-pill ${att.firma ? 'toolbox-signature-pill-active' : ''}`}
                    style={{ border: att.firma ? '1.5px solid #10b981' : undefined, background: att.firma ? 'rgba(16,185,129,0.08)' : undefined, color: att.firma ? '#10b981' : undefined }}>
                    
                                                <CheckCircle2 size={16} /> {att.firma ? 'Firmó ✓' : 'Sin firma'}
                                            </button>
                                            <button onClick={() => removeAttendee(att.id)}








                  onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(239,68,68,0.12)';e.currentTarget.style.borderColor = '#ef4444';}}
                  onMouseLeave={(e) => {e.currentTarget.style.background = 'rgba(239,68,68,0.06)';e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';}} className="bg-[rgba(239,68,68,0.06)] border-[1.5px_solid_rgba(239,68,68,0.2)] rounded-[10] p-[0.55rem] cursor-pointer text-[#ef4444] flex items-center justify-center transition-[all_0.15s]">
                    
                                                <Trash2 size={15} />
                        </button>
                                        </div>
                                    </div>
              )}
                            </div>
                        </div>

                        {/* ═══ FIRMAS Y AUTORIZACIONES ═══ */}
                        <div className="toolbox-glass-section mb-6">
                            <SectionHeader
              icon={<Pencil size={18} color="#fff" />}
              title="Firmas y Autorizaciones" />
            

                            {/* Signature toggles - Premium Pills */}
                            <div className="no-print flex gap-[0.75rem] mb-[2rem] p-[1.25rem] rounded-[16] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] items-center justify-center flex-wrap" style={{
              flexDirection: isMobile ? 'column' : 'row'





            }}>
                                <span className="text-[0.7rem] font-[800] uppercase letter-spacing-[0.06em] text-[var(--color-text-muted)] white-space-[nowrap]">



                
                                    Incluir firmas:
                                </span>
                                <div className="flex gap-[0.5rem] flex-wrap justify-center">
                                    {[
                { key: 'operator' as const, label: 'Delegado / Operador' },
                { key: 'professional' as const, label: 'Responsable / Expositor' },
                { key: 'supervisor' as const, label: 'Supervisión / Verificador' }].
                map((sig) =>
                <button
                  key={sig.key}
                  onClick={() => setShowSignatures((s) => ({ ...s, [sig.key]: !s[sig.key] }))}
                  className={`toolbox-signature-pill ${showSignatures[sig.key] ? 'toolbox-signature-pill-active' : ''}`}>
                  
                                            <CheckCircle2 size={15} />
                                            {sig.label}
                                        </button>
                )}
                                </div>
                            </div>

                            {/* On-Sheet Visual Preview of PDF signature blocks */}
                            <div className="mb-[2.5rem]">
                                <PdfSignatures
                data={{
                  ...form,
                  professionalSignature: professional.signature,
                  professionalName: professional.name,
                  professionalLicense: professional.license,
                  professionalStamp: professional.stamp
                }}
                box1={showSignatures.operator ? {
                  title: 'DELEGADO / OPERADOR',
                  subtitle: 'En representación de asistentes',
                  signatureUrl: form.operatorSignature || null,
                  isProfessional: false
                } : null}
                box2={showSignatures.professional ? {
                  title: 'RESPONSABLE / EXPOSITOR',
                  subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                  signatureUrl: form.signature || professional.signature || null,
                  stampUrl: professional.stamp || null,
                  isProfessional: true,
                  license: professional.license
                } : null}
                box3={showSignatures.supervisor ? {
                  title: 'SUPERVISIÓN / VERIFICADOR',
                  subtitle: 'Cierre / Control de Charla',
                  signatureUrl: form.supervisorSignature || null,
                  isProfessional: false
                } : null} />
              
            <PdfBrandingFooter />
                            </div>

                            {/* Interactive Signature Drawing Pads */}
                            <div className="no-print grid gap-[2rem] pt-[2rem] border-top-[1px_solid_var(--color-border)]" style={{

              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'



            }}>
                                {showSignatures.operator &&
              <SignatureCanvas
                onSave={(sig) => setForm((prev) => ({ ...prev, operatorSignature: sig || '' }))}
                initialImage={form.operatorSignature}
                label="Firma de Delegado / Operador" />

              }

                                {showSignatures.professional &&
              <SignatureCanvas
                onSave={(sig) => setForm((prev) => ({ ...prev, signature: sig || '' }))}
                initialImage={form.signature}
                label="Firma de Responsable / Expositor" />

              }

                                {showSignatures.supervisor &&
              <SignatureCanvas
                onSave={(sig) => setForm((prev) => ({ ...prev, supervisorSignature: sig || '' }))}
                initialImage={form.supervisorSignature}
                label="Firma de Supervisión / Verificador" />

              }
                            </div>
                        </div>
                    </>
        }
            </div>

            <div className="print-area fixed left-[0] top-[0] opacity-[0.01] pointer-events-[none]" style={{ zIndex: -1 }}>
                <ToolboxTalkPdfGenerator data={{ ...form, showSignatures }} professional={professional} />
            </div>
        </>);

}