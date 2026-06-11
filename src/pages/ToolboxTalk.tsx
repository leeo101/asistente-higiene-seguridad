import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import {
    MessageSquare, Plus, Trash2, Save, Share2, Printer,
    Users, Calendar, User, Building2, FileText, ChevronDown,
    CheckCircle2, Clock, Search, Eye, Edit3, History, Pencil,
    Briefcase, MapPin, Award, UserCheck, Download, ArrowLeft
} from 'lucide-react';
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

function DeleteConfirm({ onConfirm, onCancel }: any) {
    return (
        <ConfirmModal
            isOpen={true}
            onClose={onCancel}
            onConfirm={onConfirm}
            title="¿Eliminar registro?"
            message="Esta acción no se puede deshacer."
            iconEmoji="🗑️"
        />
    );
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
    { icon: '🏗️', label: 'Espacios confinados' },
];

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
    showSignatures?: { operator: boolean; professional: boolean; supervisor: boolean };
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
function ToolboxStatCard({ icon, label, value, color, gradient }: { icon: React.ReactNode; label: string; value: string | number; color: string; gradient: string }) {
    return (
        <div className="toolbox-stat-card">
            <div className="toolbox-stat-glow" style={{ background: `radial-gradient(circle, ${color}33 0%, transparent 70%)` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                <div style={{
                    width: 44, height: 44,
                    background: gradient,
                    borderRadius: 'var(--radius-xl)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 8px 24px ${color}30`,
                    color: '#ffffff'
                }}>
                    {icon}
                </div>
            </div>
            <div style={{ position: 'relative', zIndex: 1, fontSize: '2rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1, letterSpacing: '-1px', marginBottom: '0.25rem' }}>
                {value}
            </div>
            <div style={{ position: 'relative', zIndex: 1, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {label}
            </div>
        </div>
    );
}

/* ── Section Header ── */
function SectionHeader({ icon, title, rightContent }: { icon: React.ReactNode; title: string; rightContent?: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{
                margin: 0, fontWeight: 900, fontSize: '1.1rem',
                color: 'var(--color-text)',
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
                <div style={{
                    width: 36, height: 36,
                    background: 'linear-gradient(135deg, #0052CC, #0077ff)',
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 82, 204, 0.25)'
                }}>
                    {icon}
                </div>
                {title}
            </h3>
            {rightContent}
        </div>
    );
}

/* ── Input with Icon ── */
function IconInput({ icon, label, ...props }: { icon: React.ReactNode; label: string; [key: string]: any }) {
    return (
        <div>
            <label className="toolbox-input-label">{label}</label>
            <div style={{ position: 'relative' }}>
                <div style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: '#64748b', pointerEvents: 'none', display: 'flex'
                }}>
                    {icon}
                </div>
                <input className="toolbox-input-pro toolbox-focus-glow" {...props} />
            </div>
        </div>
    );
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
            if (sd) { const p = JSON.parse(sd); sig = p.signature || sig; stamp = p.stamp || null; }
            const name = pd ? JSON.parse(pd).name || '' : '';
            const license = pd ? JSON.parse(pd).license || '' : '';
            setProfessional({ name, license, signature: sig, stamp });
        } catch { }
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
            updated = talks.map(t => t.id === editId ? entry : t);
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
        save(talks.filter(t => t.id !== deleteTarget));
        setDeleteTarget(null);
        toast.success('Charla eliminada');
    };

    const addAttendee = () => {
        setForm(f => ({
            ...f,
            asistentes: [...f.asistentes, { id: `att-${Date.now()}`, nombre: '', dni: '', firma: false }]
        }));
    };

    const removeAttendee = (id: string) => {
        setForm(f => ({ ...f, asistentes: f.asistentes.filter(a => a.id !== id) }));
    };

    const updateAttendee = (id: string, field: keyof Attendee, value: any) => {
        setForm(f => ({ ...f, asistentes: f.asistentes.map(a => a.id === id ? { ...a, [field]: value } : a) }));
    };

    const filteredTalks = talks.filter(t =>
        t.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.responsable.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExportCSV = () => {
        downloadCSV(talks.map(i => ({
            fecha: new Date(i.fecha).toLocaleDateString(),
            tema: i.tema || '',
            area: i.area || '',
            responsable: i.responsable || '',
            asistentes: i.asistentes.filter(a => a.nombre).length,
            firmas: i.asistentes.filter(a => a.firma).length
        })), 'charlas_5min', {
            fecha: 'Fecha', tema: 'Tema', area: 'Área', responsable: 'Responsable', asistentes: 'Cant. Asistentes', firmas: 'Firmas Recabadas'
        });
    };

    const columns = [
        {
            header: 'Fecha',
            accessor: 'fecha',
            sortable: true,
            render: (item: ToolboxTalk) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    <Calendar size={14} /> {new Date(item.fecha + 'T12:00').toLocaleDateString('es-AR')}
                </span>
            )
        },
        {
            header: 'Tema',
            accessor: 'tema',
            sortable: true,
            render: (item: ToolboxTalk) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ background: 'rgba(0,82,204,0.1)', padding: '0.5rem', borderRadius: '8px', color: '#0052CC' }}>
                        <MessageSquare size={16} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.tema || 'Sin tema'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{item.area} • {item.responsable}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Asistencia',
            accessor: 'asistentes',
            render: (item: ToolboxTalk) => {
                const asis = item.asistentes.filter(a => a.nombre).length;
                const firm = item.asistentes.filter(a => a.firma).length;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--color-text-muted)' }} title="Asistentes"><Users size={14} /> {asis}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: firm === asis && asis > 0 ? '#10b981' : '#f59e0b' }} title="Firmas"><CheckCircle2 size={14} /> {firm}</span>
                    </div>
                );
            }
        },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: ToolboxTalk) => (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => { handleEdit(item); }} style={{ padding: '0.4rem 0.8rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}><Edit3 size={15} /> Editar</button>
                    <button onClick={() => { requirePro(() => setShareItem(item)); }} style={{ padding: '0.4rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', color: '#16a34a', cursor: 'pointer' }} title="Compartir"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={15} /></button>
                </div>
            )
        }
    ];

    // Dashboard stats
    const totalCharlas = talks.length;
    const totalAsistentes = talks.reduce((acc, t) => acc + t.asistentes.filter(a => a.nombre).length, 0);
    const totalFirmados = talks.reduce((acc, t) => acc + t.asistentes.filter(a => a.firma).length, 0);
    const tasaFirma = totalAsistentes > 0 ? Math.round((totalFirmados / totalAsistentes) * 100) : 0;

    return (
        <>
            <style>{printStyles}</style>
            <div className="container no-print" style={{ paddingTop: '6rem', paddingBottom: '6rem', maxWidth: 900 }}>
                <Breadcrumbs />

                <ShareModal
                    isOpen={!!shareItem}
                    open={!!shareItem}
                    onClose={() => setShareItem(null)}
                    title={`Charla de 5 Minutos — ${shareItem?.tema}`}
                    text={shareItem ? `📋 Charla de 5 Minutos\n📅 Fecha: ${shareItem.fecha}\n👷 Responsable: ${shareItem.responsable}\n🏢 Área: ${shareItem.area}\n📌 Tema: ${shareItem.tema}\n👥 Asistentes: ${shareItem.asistentes.filter(a => a.nombre).length}` : ''}
                    rawMessage={shareItem ? `📋 Charla de 5 Minutos\n📅 Fecha: ${shareItem.fecha}\n👷 Responsable: ${shareItem.responsable}\n🏢 Área: ${shareItem.area}\n📌 Tema: ${shareItem.tema}\n👥 Asistentes: ${shareItem.asistentes.filter(a => a.nombre).length}` : ''}
                    elementIdToPrint="toolbox-pdf-content"
                    fileName={`Charla_5min_${shareItem?.tema?.replace(/\s+/g, '_') || 'sin_tema'}.pdf`}
                />
                <div style={{ position: 'absolute', left: 0, opacity: 0.01, top: '-12000px', pointerEvents: 'none' }}>
                    {shareItem && <ToolboxTalkPdfGenerator data={{ ...shareItem, showSignatures: shareItem.showSignatures || { operator: false, professional: true, supervisor: false } }} professional={professional} />}
                </div>

                {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}

                {/* Floating Action Buttons */}
                {showForm && (
                    <div className="no-print floating-action-bar">
                        <button onClick={(e) => { e.preventDefault(); requirePro(handleSave); }} className="btn-floating-action" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}>
                            <Save size={18} /> GUARDAR
                        </button>
                        <button onClick={() => requirePro(() => window.print())} className="btn-floating-action" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}>
                            <Printer size={18} /> IMPRIMIR
                        </button>
                    </div>
                )}

                {!showForm ? (
                    <>
                        <PremiumHeader 
                            title="Charla de 5 Minutos" 
                            subtitle="Registro de asistentes y firma digital" 
                            icon={<MessageSquare size={36} color="#ffffff" />} 
                        />

                        {/* ═══ Stats Dashboard ═══ */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            <ToolboxStatCard
                                icon={<MessageSquare size={20} color="#fff" />}
                                label="Charlas Dictadas"
                                value={totalCharlas}
                                color="#8b5cf6"
                                gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
                            />
                            <ToolboxStatCard
                                icon={<Users size={20} color="#fff" />}
                                label="Personal Capacitado"
                                value={totalAsistentes}
                                color="#10b981"
                                gradient="linear-gradient(135deg, #10b981, #059669)"
                            />
                            <ToolboxStatCard
                                icon={<CheckCircle2 size={20} color="#fff" />}
                                label="Firmas Obtenidas"
                                value={totalFirmados}
                                color="#0052CC"
                                gradient="linear-gradient(135deg, #0052CC, #0077ff)"
                            />
                            <ToolboxStatCard
                                icon={<Award size={20} color="#fff" />}
                                label="Tasa de Firma"
                                value={`${tasaFirma}%`}
                                color="#f59e0b"
                                gradient="linear-gradient(135deg, #f59e0b, #d97706)"
                            />
                        </div>
                        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <button onClick={() => navigate('/', { state: { scrollTo: 'toolbox-talk' } })} style={{
                                display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1.5rem',
                                background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)',
                                borderRadius: '12px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                                boxShadow: 'var(--shadow-sm)'
                            }}>
                                <ArrowLeft size={20} /> INICIO
                            </button>
                            <button
                                onClick={() => { 
                                    setForm(emptyTalk());
                                    setEditId(null);
                                    setShowForm(true); 
                                }}
                                style={{ flex: '0 1 auto', padding: '1rem 1.5rem', borderRadius: '16px', background: '#36B37E', color: '#fff', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(54,179,126,0.3)', whiteSpace: 'nowrap' }}
                            >
                                <Plus size={20} /> Nueva Charla
                            </button>
                            <div style={{ flex: '1 1 100%', minWidth: 0, position: 'relative' }}>
                                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por tema, área o responsable..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '16px', border: '2px solid var(--color-border)', fontSize: '1rem', outline: 'none', background: 'var(--color-surface)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                                />
                            </div>
                            {talks.length > 0 && (
                                <button onClick={handleExportCSV} style={{ flex: '0 1 auto', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-primary)', border: 'none', borderRadius: '16px', padding: '1rem 1.5rem', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', color: '#ffffff', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                                    <Download size={20} /> Excel
                                </button>
                            )}
                        </div>

                        <DataTable
                            data={filteredTalks}
                            columns={columns}
                            searchPlaceholder="Buscar..."
                            emptyMessage="No hay charlas registradas."
                            emptyIcon={<MessageSquare size={48} />}
                        />
                    </>
                ) : (
                    <>
                        <div className="no-print">
                            <PremiumHeader 
                                title={editId ? 'Editar Charla' : 'Nueva Charla'} 
                                subtitle="Registro de asistentes y firma digital" 
                                icon={<MessageSquare size={36} color="#ffffff" />} 
                            />
                            <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', zIndex: 10 }}>
                                <button 
                                    onClick={() => setShowForm(false)} 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.5rem', 
                                        padding: '0.5rem 1.25rem', 
                                        background: 'linear-gradient(135deg, #36B37E 0%, #2A9365 100%)', 
                                        border: 'none', 
                                        borderRadius: '12px', 
                                        color: '#ffffff', 
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(54, 179, 126, 0.3)',
                                        transition: 'all 0.2s',
                                        letterSpacing: '0.3px'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(54, 179, 126, 0.4)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(54, 179, 126, 0.3)'; }}
                                >
                                    <ArrowLeft size={18} strokeWidth={2.5} /> Volver
                                </button>
                            </div>
                        </div>

                        {/* ═══ DATOS GENERALES ═══ */}
                        <div className="toolbox-glass-section no-print" style={{ marginBottom: '1.5rem' }}>
                            <SectionHeader
                                icon={<Building2 size={18} color="#fff" />}
                                title="Datos Generales"
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <IconInput icon={<Calendar size={16} />} label="Fecha"
                                    type="date" value={form.fecha}
                                    onChange={(e: any) => setForm(f => ({ ...f, fecha: e.target.value }))}
                                />
                                <IconInput icon={<Building2 size={16} />} label="Empresa / Establecimiento"
                                    type="text" value={form.empresa}
                                    onChange={(e: any) => setForm(f => ({ ...f, empresa: e.target.value }))}
                                    placeholder="Nombre de la empresa"
                                />
                                <IconInput icon={<MapPin size={16} />} label="Área / Sector"
                                    type="text" value={form.area}
                                    onChange={(e: any) => setForm(f => ({ ...f, area: e.target.value }))}
                                    placeholder="Ej: Producción, Almacén..."
                                />
                                <IconInput icon={<User size={16} />} label="Responsable de la Charla"
                                    type="text" value={form.responsable}
                                    onChange={(e: any) => setForm(f => ({ ...f, responsable: e.target.value }))}
                                    placeholder="Nombre y apellido"
                                />
                                <IconInput icon={<Briefcase size={16} />} label="Cargo del Responsable"
                                    type="text" value={form.cargoResponsable}
                                    onChange={(e: any) => setForm(f => ({ ...f, cargoResponsable: e.target.value }))}
                                    placeholder="Ej: Supervisor, HSYMA..."
                                />
                            </div>

                            {/* ── Tema con plantillas ── */}
                            <div style={{ marginTop: '1.25rem' }}>
                                <label className="toolbox-input-label">Tema de la Charla *</label>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input type="text" value={form.tema}
                                        onChange={e => setForm(f => ({ ...f, tema: e.target.value }))}
                                        placeholder="Ingresá o seleccioná un tema..."
                                        className="toolbox-input-plain toolbox-focus-glow"
                                        style={{ paddingRight: '110px' }}
                                    />
                                    <button
                                        onClick={() => setShowTopics(s => !s)}
                                        style={{
                                            position: 'absolute', right: '6px',
                                            padding: '0.4rem 0.8rem',
                                            background: showTopics ? 'rgba(0,82,204,0.1)' : 'linear-gradient(135deg, #0052CC, #0077ff)',
                                            color: showTopics ? '#0052CC' : '#fff', 
                                            border: 'none', borderRadius: '10px',
                                            fontWeight: 700, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                                            fontSize: '0.75rem',
                                            boxShadow: showTopics ? 'none' : '0 2px 8px rgba(0,82,204,0.25)',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                    >
                                        <ChevronDown size={14} style={{
                                            transition: 'transform 0.25s',
                                            transform: showTopics ? 'rotate(180deg)' : 'rotate(0deg)'
                                        }} /> 
                                        {showTopics ? 'Cerrar' : 'Plantillas'}
                                    </button>
                                </div>

                                {/* ── Topic Chips Gallery ── */}
                                {showTopics && (
                                    <div style={{
                                        marginTop: '0.85rem',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                                        gap: '0.6rem',
                                        animation: 'fadeIn 0.25s ease-out'
                                    }}>
                                        {TOPICS_TEMPLATES.map(t => (
                                            <button key={t.label}
                                                className="toolbox-topic-chip"
                                                onClick={() => {
                                                    setForm(f => ({ ...f, tema: t.label }));
                                                    setShowTopics(false);
                                                }}
                                            >
                                                <span>{t.icon}</span> <span style={{ flex: 1, textAlign: 'left' }}>{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ── Desarrollo ── */}
                            <div style={{ marginTop: '1.25rem' }}>
                                <label className="toolbox-input-label">Desarrollo / Puntos Tratados</label>
                                <textarea value={form.desarrollo}
                                    onChange={e => setForm(f => ({ ...f, desarrollo: e.target.value }))}
                                    placeholder="Describí los puntos principales de la charla, consultas del personal, acuerdos..."
                                    className="toolbox-input-plain toolbox-focus-glow"
                                    style={{ minHeight: '120px', resize: 'vertical', lineHeight: '1.5' }}
                                />
                            </div>

                            {/* ── Observaciones ── */}
                            <div style={{ marginTop: '1rem' }}>
                                <label style={{
                                    display: 'block', fontSize: '0.7rem', fontWeight: 800,
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                    color: 'var(--color-text-muted)', marginBottom: '0.4rem'
                                }}>
                                    Observaciones
                                </label>
                                <textarea value={form.observaciones}
                                    onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                                    placeholder="Dudas, compromisos, acciones a tomar..."
                                    className="toolbox-input-plain toolbox-focus-glow"
                                    style={{ minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }}
                                />
                            </div>
                        </div>

                        {/* ═══ LISTA DE ASISTENTES ═══ */}
                        <div className="toolbox-glass-section no-print" style={{ marginBottom: '1.5rem' }}>
                            <SectionHeader
                                icon={<Users size={18} color="#fff" />}
                                title={`Lista de Asistentes (${form.asistentes.filter(a => a.nombre).length})`}
                                rightContent={
                                    <button onClick={addAttendee}
                                        style={{
                                            padding: '0.5rem 1.1rem',
                                            background: 'linear-gradient(135deg, #0052CC, #0077ff)',
                                            color: '#fff', border: 'none', borderRadius: 12,
                                            fontWeight: 700, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            fontSize: '0.82rem',
                                            boxShadow: '0 4px 12px rgba(0,82,204,0.25)',
                                            transition: 'all 0.2s'
                                        }}>
                                        <Plus size={16} /> Agregar
                                    </button>
                                }
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {form.asistentes.map((att, idx) => (
                                    <div key={att.id} className="toolbox-asistente-card">
                                        <span className="toolbox-asistente-badge">Asistente #{idx + 1}</span>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr auto auto',
                                            gap: '0.6rem',
                                            alignItems: 'center'
                                        }}>
                                            <input type="text" value={att.nombre}
                                                onChange={e => updateAttendee(att.id, 'nombre', e.target.value)}
                                                placeholder={`Nombre completo`}
                                                className="toolbox-input-plain toolbox-focus-glow"
                                            />
                                            <input type="text" value={att.dni}
                                                onChange={e => updateAttendee(att.id, 'dni', e.target.value)}
                                                placeholder="DNI"
                                                className="toolbox-input-plain toolbox-focus-glow"
                                            />
                                            <button
                                                onClick={() => updateAttendee(att.id, 'firma', !att.firma)}
                                                className={`toolbox-signature-pill ${att.firma ? 'toolbox-signature-pill-active' : ''}`}
                                                style={{ border: att.firma ? '1.5px solid #10b981' : undefined, background: att.firma ? 'rgba(16,185,129,0.08)' : undefined, color: att.firma ? '#10b981' : undefined }}
                                            >
                                                <CheckCircle2 size={16} /> {att.firma ? 'Firmó ✓' : 'Sin firma'}
                                            </button>
                                            <button onClick={() => removeAttendee(att.id)}
                                                style={{
                                                    background: 'rgba(239,68,68,0.06)',
                                                    border: '1.5px solid rgba(239,68,68,0.2)',
                                                    borderRadius: 10, padding: '0.55rem',
                                                    cursor: 'pointer', color: '#ef4444',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.15s'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
                                            >
                                                <Trash2 size={15}  />
                        </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ═══ FIRMAS Y AUTORIZACIONES ═══ */}
                        <div className="toolbox-glass-section" style={{ marginBottom: '1.5rem' }}>
                            <SectionHeader
                                icon={<Pencil size={18} color="#fff" />}
                                title="Firmas y Autorizaciones"
                            />

                            {/* Signature toggles - Premium Pills */}
                            <div className="no-print" style={{
                                display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                                gap: '0.75rem', marginBottom: '2rem',
                                padding: '1.25rem', borderRadius: 16,
                                background: 'var(--color-background)',
                                border: '1px solid var(--color-border)',
                                alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap'
                            }}>
                                <span style={{
                                    fontSize: '0.7rem', fontWeight: 800,
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                    color: 'var(--color-text-muted)', whiteSpace: 'nowrap'
                                }}>
                                    Incluir firmas:
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {[
                                        { key: 'operator' as const, label: 'Delegado / Operador' },
                                        { key: 'professional' as const, label: 'Responsable / Expositor' },
                                        { key: 'supervisor' as const, label: 'Supervisión / Verificador' }
                                    ].map(sig => (
                                        <button
                                            key={sig.key}
                                            onClick={() => setShowSignatures(s => ({ ...s, [sig.key]: !s[sig.key] }))}
                                            className={`toolbox-signature-pill ${showSignatures[sig.key] ? 'toolbox-signature-pill-active' : ''}`}
                                        >
                                            <CheckCircle2 size={15} />
                                            {sig.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* On-Sheet Visual Preview of PDF signature blocks */}
                            <div style={{ marginBottom: '2.5rem' }}>
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
                                    } : null}
                                />
                            </div>

                            {/* Interactive Signature Drawing Pads */}
                            <div className="no-print" style={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                gap: '2rem',
                                paddingTop: '2rem',
                                borderTop: '1px solid var(--color-border)'
                            }}>
                                {showSignatures.operator && (
                                    <SignatureCanvas
                                        onSave={(sig) => setForm(prev => ({ ...prev, operatorSignature: sig || '' }))}
                                        initialImage={form.operatorSignature}
                                        label="Firma de Delegado / Operador"
                                    />
                                )}

                                {showSignatures.professional && (
                                    <SignatureCanvas
                                        onSave={(sig) => setForm(prev => ({ ...prev, signature: sig || '' }))}
                                        initialImage={form.signature}
                                        label="Firma de Responsable / Expositor"
                                    />
                                )}

                                {showSignatures.supervisor && (
                                    <SignatureCanvas
                                        onSave={(sig) => setForm(prev => ({ ...prev, supervisorSignature: sig || '' }))}
                                        initialImage={form.supervisorSignature}
                                        label="Firma de Supervisión / Verificador"
                                    />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="print-area" style={{ position: 'fixed', left: 0, top: 0, opacity: 0.01, pointerEvents: 'none', zIndex: -1 }}>
                <ToolboxTalkPdfGenerator data={{ ...form, showSignatures }} professional={professional} />
            </div>
        </>
    );
}
